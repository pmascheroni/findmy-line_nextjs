import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SPORT_PATH_MAP = {
  americanfootball_nfl: "football/nfl",
  americanfootball_ncaaf: "football/college-football",
  basketball_nba: "basketball/nba",
  basketball_ncaab: "basketball/mens-college-basketball",
  baseball_mlb: "baseball/mlb",
  icehockey_nhl: "hockey/nhl",
  mma_mixed_martial_arts: "mma/ufc",
  soccer_epl: "soccer/eng.1",
  soccer_usa_mls: "soccer/usa.1",
  soccer_germany_bundesliga: "soccer/ger.1",
  soccer_spain_la_liga: "soccer/esp.1",
  soccer_italy_serie_a: "soccer/ita.1",
  soccer_france_ligue_one: "soccer/fra.1",
  soccer_uefa_champs_league: "soccer/uefa.champions",
};

const cache = new Map();
const TTL = 10 * 60 * 1000; // 10 min

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FindMyLine/1.0" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

function normalizeWords(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

function teamsMatch(espnName = "", gameName = "") {
  const ew = normalizeWords(espnName);
  const gw = normalizeWords(gameName);
  if (!ew.length || !gw.length) return false;
  return gw.some((g) => ew.some((e) => e === g || (e.length > 4 && g.length > 4 && (e.includes(g) || g.includes(e)))));
}

async function findTeamId(sportPath, teamName) {
  const data = await fetchJson(
    `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams?limit=500`
  );
  const allTeams = (data?.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => t.team || t);
  const match = allTeams.find(
    (t) =>
      teamsMatch(t.displayName, teamName) ||
      teamsMatch(t.shortDisplayName, teamName) ||
      teamsMatch(t.nickname, teamName)
  );
  return match?.id || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey");
  const homeTeam = searchParams.get("homeTeam") || "";
  const awayTeam = searchParams.get("awayTeam") || "";

  if (!sportKey) {
    return NextResponse.json({ error: "sportKey required" }, { status: 400 });
  }

  const sportPath = SPORT_PATH_MAP[sportKey];
  if (!sportPath) {
    return NextResponse.json({ articles: [], unsupported: true });
  }

  const cacheKey = `news:${sportKey}:${homeTeam}:${awayTeam}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const articles = [];
    const seen = new Set();

    // Fetch news for each team
    for (const teamName of [homeTeam, awayTeam].filter(Boolean)) {
      const teamId = await findTeamId(sportPath, teamName);
      if (!teamId) continue;

      const data = await fetchJson(
        `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news?team=${teamId}&limit=10`
      );

      for (const article of data?.articles || []) {
        const id = article.dataSourceIdentifier || article.headline;
        if (seen.has(id)) continue;
        seen.add(id);

        articles.push({
          headline: article.headline || "",
          description: article.description || "",
          published: article.published || null,
          image: article.images?.[0]?.url || null,
          link: article.links?.web?.href || article.links?.api?.news?.href || null,
          source: article.source || "ESPN",
          type: article.type || "story",
          relatedTeam: teamName,
        });
      }
    }

    // Also try league-level news
    try {
      const leagueData = await fetchJson(
        `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news?limit=5`
      );
      for (const article of leagueData?.articles || []) {
        const id = article.dataSourceIdentifier || article.headline;
        if (seen.has(id)) continue;

        // Only include if it mentions one of the teams
        const text = `${article.headline || ""} ${article.description || ""}`.toLowerCase();
        const homeWords = normalizeWords(homeTeam);
        const awayWords = normalizeWords(awayTeam);
        const mentionsTeam =
          homeWords.some((w) => text.includes(w)) || awayWords.some((w) => text.includes(w));

        if (mentionsTeam) {
          seen.add(id);
          articles.push({
            headline: article.headline || "",
            description: article.description || "",
            published: article.published || null,
            image: article.images?.[0]?.url || null,
            link: article.links?.web?.href || null,
            source: article.source || "ESPN",
            type: article.type || "story",
            relatedTeam: null,
          });
        }
      }
    } catch {
      /* league news is optional */
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => {
      const da = new Date(a.published || 0).getTime();
      const db = new Date(b.published || 0).getTime();
      return db - da;
    });

    const result = { articles: articles.slice(0, 15) };
    cache.set(cacheKey, { ts: Date.now(), data: result });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/espn/news]", err);
    return NextResponse.json({ articles: [], error: "Failed to fetch news" });
  }
}
