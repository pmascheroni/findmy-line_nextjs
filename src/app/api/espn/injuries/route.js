import { NextResponse } from "next/server";

const SPORT_CONFIG = {
  americanfootball_nfl: {
    scoreboardPath: "football/nfl",
    league: "football/leagues/nfl",
    teamsPath: "football/nfl",
    espnSport: "football",
    espnLeague: "nfl",
  },
  americanfootball_ncaaf: {
    scoreboardPath: "football/college-football",
    league: "football/leagues/college-football",
    teamsPath: "football/college-football",
    espnSport: "football",
    espnLeague: "college-football",
  },
  basketball_nba: {
    scoreboardPath: "basketball/nba",
    league: "basketball/leagues/nba",
    teamsPath: "basketball/nba",
    espnSport: "basketball",
    espnLeague: "nba",
  },
  basketball_ncaab: {
    scoreboardPath: "basketball/mens-college-basketball",
    league: "basketball/leagues/mens-college-basketball",
    teamsPath: "basketball/mens-college-basketball",
    espnSport: "basketball",
    espnLeague: "mens-college-basketball",
  },
  baseball_mlb: {
    scoreboardPath: "baseball/mlb",
    league: "baseball/leagues/mlb",
    teamsPath: "baseball/mlb",
    espnSport: "baseball",
    espnLeague: "mlb",
  },
  icehockey_nhl: {
    scoreboardPath: "hockey/nhl",
    league: "hockey/leagues/nhl",
    teamsPath: "hockey/nhl",
    espnSport: "hockey",
    espnLeague: "nhl",
  },
  soccer_epl: {
    scoreboardPath: "soccer/eng.1",
    league: "soccer/leagues/eng.1",
    teamsPath: "soccer/eng.1",
    espnSport: "soccer",
    espnLeague: "eng.1",
  },
  soccer_usa_mls: {
    scoreboardPath: "soccer/usa.1",
    league: "soccer/leagues/usa.1",
    teamsPath: "soccer/usa.1",
    espnSport: "soccer",
    espnLeague: "usa.1",
  },
  soccer_germany_bundesliga: {
    scoreboardPath: "soccer/ger.1",
    league: "soccer/leagues/ger.1",
    teamsPath: "soccer/ger.1",
    espnSport: "soccer",
    espnLeague: "ger.1",
  },
  soccer_spain_la_liga: {
    scoreboardPath: "soccer/esp.1",
    league: "soccer/leagues/esp.1",
    teamsPath: "soccer/esp.1",
    espnSport: "soccer",
    espnLeague: "esp.1",
  },
  soccer_italy_serie_a: {
    scoreboardPath: "soccer/ita.1",
    league: "soccer/leagues/ita.1",
    teamsPath: "soccer/ita.1",
    espnSport: "soccer",
    espnLeague: "ita.1",
  },
  soccer_france_ligue_one: {
    scoreboardPath: "soccer/fra.1",
    league: "soccer/leagues/fra.1",
    teamsPath: "soccer/fra.1",
    espnSport: "soccer",
    espnLeague: "fra.1",
  },
  soccer_uefa_champs_league: {
    scoreboardPath: "soccer/uefa.champions",
    league: "soccer/leagues/uefa.champions",
    teamsPath: "soccer/uefa.champions",
    espnSport: "soccer",
    espnLeague: "uefa.champions",
  },
};

// In-memory team ID cache: sportKey -> [{ id, displayName, shortDisplayName, abbreviation }]
const teamCache = new Map();
const TEAM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Keywords that strongly indicate injury content — avoid short words like "out" alone
const INJURY_KEYWORDS = [
  "injured", "injury", "injuries",
  "out for", "ruled out", "sits out", "miss",
  "questionable", "doubtful", "day-to-day", "gtd",
  "acl", "surgery", "torn", "fracture", "concussion",
  "sprain", "strain", "hamstring", "sidelined",
  "season-ending", "inactive", "lower leg", "upper body",
  "lower body", "illness", "health and safety",
  "won't play", "will not play", "out with", "limited",
];

const getTeamWords = (name = "") =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const teamsMatch = (espnName = "", gameName = "") => {
  const espnWords = getTeamWords(espnName);
  const gameWords = getTeamWords(gameName);
  if (!espnWords.length || !gameWords.length) return false;
  // Require that MOST words match, not just one — prevents "Michigan" matching "Western Michigan"
  const matches = gameWords.filter((gw) =>
    espnWords.some((ew) => ew.includes(gw) || gw.includes(ew))
  );
  return matches.length >= Math.max(1, Math.ceil(gameWords.length * 0.6));
};

/**
 * Stricter match: require the key location word or at least half the words.
 * "Michigan Wolverines" should match "Michigan Wolverines" but NOT "Western Michigan".
 */
const teamsMatchStrict = (espnName = "", gameName = "") => {
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const en = normalize(espnName);
  const gn = normalize(gameName);
  // Exact or substring match first
  if (en === gn || en.includes(gn) || gn.includes(en)) return true;
  // Word overlap requiring majority
  const espnWords = getTeamWords(espnName);
  const gameWords = getTeamWords(gameName);
  if (!espnWords.length || !gameWords.length) return false;
  const matches = gameWords.filter((gw) =>
    espnWords.some((ew) => ew === gw || (ew.length > 4 && gw.length > 4 && (ew.includes(gw) || gw.includes(ew))))
  );
  return matches.length >= Math.ceil(gameWords.length * 0.7);
};

const normalizeRef = (ref) => ref?.replace(/^http:/, "https:");

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FindMyLine/1.0" },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

/**
 * Find a team's ESPN ID by fuzzy name match.
 * First tries to load all teams for the league (cached for 24h),
 * then falls back to scoreboard matching.
 */
async function findTeamId(teamName, config, sportKey) {
  // Try team list cache
  const cacheKey = sportKey;
  const cached = teamCache.get(cacheKey);
  const now = Date.now();

  let teams = cached && now - cached.ts < TEAM_CACHE_TTL ? cached.data : null;

  if (!teams) {
    try {
      // Load all teams for this league
      const url = `https://site.api.espn.com/apis/site/v2/sports/${config.teamsPath}/teams?limit=900`;
      const data = await fetchJson(url);
      // ESPN teams response varies by sport - try different paths
      const sportLeagues = data?.sports?.[0]?.leagues?.[0]?.teams;
      const directTeams = data?.teams;
      const rawTeams = sportLeagues || directTeams || [];
      teams = rawTeams.map((t) => {
        const team = t.team || t;
        return {
          id: team.id,
          displayName: team.displayName || team.name || "",
          shortDisplayName: team.shortDisplayName || "",
          abbreviation: team.abbreviation || "",
          logo: team.logos?.[0]?.href || team.logo || null,
        };
      });
      teamCache.set(cacheKey, { ts: now, data: teams });
    } catch {
      teams = [];
    }
  }

  // Strict match first, then fallback to fuzzy
  const match =
    teams.find((t) =>
      [t.displayName, t.shortDisplayName].some((n) => teamsMatchStrict(n, teamName))
    ) ||
    teams.find((t) =>
      [t.displayName, t.shortDisplayName, t.abbreviation].some((n) => teamsMatch(n, teamName))
    );

  return match ? { id: match.id, logo: match.logo, name: match.displayName } : null;
}

/**
 * Fetch official ESPN injuries for a team via the core API.
 * Returns injuries array (may be empty for college leagues).
 */
async function fetchOfficialInjuries({ leaguePath, teamId, fallbackName, fallbackLogo }) {
  if (!teamId) return { teamName: fallbackName, logo: fallbackLogo, injuries: [], source: "espn" };

  try {
    const listUrl = `https://sports.core.api.espn.com/v2/sports/${leaguePath}/teams/${teamId}/injuries?lang=en&region=us`;
    const listData = await fetchJson(listUrl);
    const injuryRefs = (listData.items || []).map((item) => normalizeRef(item?.$ref)).filter(Boolean);

    const injuryDetails = await Promise.all(
      injuryRefs.slice(0, 15).map(async (injuryRef) => {
        const injuryData = await fetchJson(injuryRef);
        const athleteRef = normalizeRef(injuryData?.athlete?.$ref);
        const athleteData = athleteRef ? await fetchJson(athleteRef) : null;
        return {
          name: athleteData?.displayName || athleteData?.fullName || "Unknown Player",
          position: athleteData?.position?.abbreviation || athleteData?.position?.displayName || "—",
          status:
            injuryData?.details?.fantasyStatus?.description ||
            injuryData?.type?.description ||
            injuryData?.status ||
            "Reported",
          injuryType:
            injuryData?.details?.type || injuryData?.details?.detail || injuryData?.shortComment || null,
          returnDate: injuryData?.details?.returnDate || injuryData?.date || null,
          headshot: athleteData?.headshot?.href || null,
          comment: injuryData?.shortComment || injuryData?.longComment || null,
          source: "ESPN Official",
          sourceUrl: `https://www.espn.com/${leaguePath.split("/leagues/")[0]}/team/injuries/_/id/${teamId}`,
        };
      })
    );

    return { teamName: fallbackName, logo: fallbackLogo, injuries: injuryDetails, source: "espn_official" };
  } catch {
    return { teamName: fallbackName, logo: fallbackLogo, injuries: [], source: "espn_official" };
  }
}

/**
 * Fetch injury-related news articles from ESPN for a team.
 * Used as a fallback when official injury API returns nothing (e.g. NCAAB).
 */
async function fetchInjuryNews({ teamId, config, teamName, logo }) {
  if (!teamId) return [];

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.teamsPath}/news?team=${teamId}&limit=20`;
    const data = await fetchJson(url);
    const articles = data?.articles || [];

    // Filter articles that mention injuries
    const injuryArticles = articles.filter((a) => {
      const text = `${a.headline || ""} ${a.description || ""}`.toLowerCase();
      return INJURY_KEYWORDS.some((kw) => text.includes(kw));
    });

    return injuryArticles.slice(0, 3).map((a) => ({
      headline: a.headline,
      description: a.description || "",
      url: a.links?.web?.href || `https://www.espn.com/${config.espnSport}/${config.espnLeague}/news`,
      published: a.published ? new Date(a.published).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
      images: a.images?.[0]?.url || null,
    }));
  } catch {
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey");
  const homeTeam = searchParams.get("homeTeam") || "";
  const awayTeam = searchParams.get("awayTeam") || "";

  if (!sportKey || !homeTeam || !awayTeam) {
    return NextResponse.json({ error: "sportKey, homeTeam, and awayTeam are required" }, { status: 400 });
  }

  const config = SPORT_CONFIG[sportKey];
  if (!config) {
    return NextResponse.json({
      home: { teamName: homeTeam, logo: null, injuries: [], injuryNews: [] },
      away: { teamName: awayTeam, logo: null, injuries: [], injuryNews: [] },
      unsupported: true,
    });
  }

  try {
    // Look up team IDs by name (not scoreboard) — works for future games too
    const [homeTeamInfo, awayTeamInfo] = await Promise.all([
      findTeamId(homeTeam, config, sportKey),
      findTeamId(awayTeam, config, sportKey),
    ]);

    // Fetch official injuries + news in parallel for both teams
    const [homeOfficial, awayOfficial, homeNews, awayNews] = await Promise.all([
      fetchOfficialInjuries({
        leaguePath: config.league,
        teamId: homeTeamInfo?.id,
        fallbackName: homeTeamInfo?.name || homeTeam,
        fallbackLogo: homeTeamInfo?.logo || null,
      }),
      fetchOfficialInjuries({
        leaguePath: config.league,
        teamId: awayTeamInfo?.id,
        fallbackName: awayTeamInfo?.name || awayTeam,
        fallbackLogo: awayTeamInfo?.logo || null,
      }),
      fetchInjuryNews({ teamId: homeTeamInfo?.id, config, teamName: homeTeam, logo: homeTeamInfo?.logo }),
      fetchInjuryNews({ teamId: awayTeamInfo?.id, config, teamName: awayTeam, logo: awayTeamInfo?.logo }),
    ]);

    return NextResponse.json({
      home: {
        ...homeOfficial,
        injuryNews: homeNews,
        teamFound: !!homeTeamInfo,
      },
      away: {
        ...awayOfficial,
        injuryNews: awayNews,
        teamFound: !!awayTeamInfo,
      },
      foundGame: true,
    });
  } catch (error) {
    console.error("[api/espn/injuries]", error);
    return NextResponse.json({ error: "Failed to fetch ESPN injuries" }, { status: 500 });
  }
}
