import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SPORT_PATH_MAP = {
  americanfootball_nfl: "football/nfl",
  americanfootball_ncaaf: "football/college-football",
  basketball_nba: "basketball/nba",
  basketball_ncaab: "basketball/mens-college-basketball",
  baseball_mlb: "baseball/mlb",
  icehockey_nhl: "hockey/nhl",
  soccer_epl: "soccer/eng.1",
  soccer_usa_mls: "soccer/usa.1",
  soccer_germany_bundesliga: "soccer/ger.1",
  soccer_spain_la_liga: "soccer/esp.1",
  soccer_italy_serie_a: "soccer/ita.1",
  soccer_france_ligue_one: "soccer/fra.1",
  soccer_uefa_champs_league: "soccer/uefa.champions",
};

const TEAMS_PATH_MAP = {
  americanfootball_nfl: "football/nfl",
  americanfootball_ncaaf: "football/college-football",
  basketball_nba: "basketball/nba",
  basketball_ncaab: "basketball/mens-college-basketball",
  baseball_mlb: "baseball/mlb",
  icehockey_nhl: "hockey/nhl",
  soccer_epl: "soccer/eng.1",
  soccer_usa_mls: "soccer/usa.1",
  soccer_germany_bundesliga: "soccer/ger.1",
  soccer_spain_la_liga: "soccer/esp.1",
  soccer_italy_serie_a: "soccer/ita.1",
  soccer_france_ligue_one: "soccer/fra.1",
  soccer_uefa_champs_league: "soccer/uefa.champions",
};

// Team stats to display with labels
const TEAM_STAT_KEYS = [
  { key: "avgPoints", label: "Points" },
  { key: "avgPointsAgainst", label: "Points Against" },
  { key: "fieldGoalPct", label: "Field Goal %" },
  { key: "threePointFieldGoalPct", label: "3-Point %" },
  { key: "avgRebounds", label: "Rebounds" },
  { key: "avgAssists", label: "Assists" },
  { key: "avgBlocks", label: "Blocks" },
  { key: "avgSteals", label: "Steals" },
  // Football
  { key: "avgYards", label: "Yards/Game" },
  { key: "avgPassingYards", label: "Pass Yards/Game" },
  { key: "avgRushingYards", label: "Rush Yards/Game" },
  { key: "avgPointsAgainst", label: "Points Allowed" },
  // Baseball
  { key: "battingAvg", label: "Batting Avg" },
  { key: "ERA", label: "ERA" },
  { key: "avgRuns", label: "Runs/Game" },
  // Hockey
  { key: "avgGoalsFor", label: "Goals For" },
  { key: "avgGoalsAgainst", label: "Goals Against" },
  { key: "powerPlayPct", label: "Power Play %" },
];

const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 min

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FindMyLine/1.0" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function getTeamWords(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

function teamsMatch(espnName = "", gameName = "") {
  const ew = getTeamWords(espnName);
  const gw = getTeamWords(gameName);
  if (!ew.length || !gw.length) return false;
  const matches = gw.filter((g) => ew.some((e) => e === g || (e.length > 4 && g.length > 4 && (e.includes(g) || g.includes(e)))));
  return matches.length >= Math.ceil(gw.length * 0.6);
}

async function findEspnEventId(sportPath, homeTeam, awayTeam, commenceTime) {
  // Search scoreboard for today + upcoming dates
  const datesToSearch = [];
  const base = commenceTime ? new Date(commenceTime) : new Date();
  for (let i = -1; i <= 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    datesToSearch.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }

  for (const dateStr of datesToSearch) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?dates=${dateStr}&limit=50`;
      const data = await fetchJson(url);
      for (const event of data?.events || []) {
        const competitors = event?.competitions?.[0]?.competitors || [];
        const home = competitors.find((c) => c.homeAway === "home");
        const away = competitors.find((c) => c.homeAway === "away");
        if (!home || !away) continue;
        const homeNames = [home.team?.displayName, home.team?.shortDisplayName, home.team?.name].filter(Boolean);
        const awayNames = [away.team?.displayName, away.team?.shortDisplayName, away.team?.name].filter(Boolean);
        if (
          homeNames.some((n) => teamsMatch(n, homeTeam)) &&
          awayNames.some((n) => teamsMatch(n, awayTeam))
        ) {
          return {
            eventId: event.id,
            homeTeamInfo: { id: home.team?.id, abbrev: home.team?.abbreviation, name: home.team?.displayName, logo: home.team?.logo || home.team?.logos?.[0]?.href, record: home.records?.[0]?.displayValue || home.record?.[0]?.displayValue || "", rank: home.curatedRank?.current || home.rank || null },
            awayTeamInfo: { id: away.team?.id, abbrev: away.team?.abbreviation, name: away.team?.displayName, logo: away.team?.logo || away.team?.logos?.[0]?.href, record: away.records?.[0]?.displayValue || away.record?.[0]?.displayValue || "", rank: away.curatedRank?.current || away.rank || null },
          };
        }
      }
    } catch {
      // continue to next date
    }
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey");
  const homeTeam = searchParams.get("homeTeam") || "";
  const awayTeam = searchParams.get("awayTeam") || "";
  const commenceTime = searchParams.get("commenceTime");
  // Optional: caller can pass espnEventId directly (from game sessionStorage meta)
  const espnEventId = searchParams.get("espnEventId");

  if (!sportKey || !homeTeam || !awayTeam) {
    return NextResponse.json({ error: "sportKey, homeTeam, awayTeam required" }, { status: 400 });
  }

  const sportPath = SPORT_PATH_MAP[sportKey];
  if (!sportPath) {
    return NextResponse.json({ error: "Sport not supported", unsupported: true });
  }

  const cacheKey = `${sportKey}:${homeTeam}:${awayTeam}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Find ESPN event ID
    let eventInfo = null;
    if (espnEventId) {
      // Try to get team info from scoreboard for that specific event date
      try {
        const eventData = await fetchJson(
          `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${espnEventId}`
        );
        const comps = eventData?.header?.competitions?.[0]?.competitors || [];
        const home = comps.find((c) => c.homeAway === "home");
        const away = comps.find((c) => c.homeAway === "away");
        if (home && away) {
          eventInfo = {
            eventId: espnEventId,
            homeTeamInfo: { id: home.team?.id, abbrev: home.team?.abbreviation, name: home.team?.displayName, logo: home.team?.logo, record: home.record?.[0]?.displayValue || "", rank: home.rank || null },
            awayTeamInfo: { id: away.team?.id, abbrev: away.team?.abbreviation, name: away.team?.displayName, logo: away.team?.logo, record: away.record?.[0]?.displayValue || "", rank: away.rank || null },
          };
        }
      } catch { /* fall through */ }
    }

    if (!eventInfo) {
      eventInfo = await findEspnEventId(sportPath, homeTeam, awayTeam, commenceTime);
    }

    if (!eventInfo) {
      return NextResponse.json({ found: false, message: "Game not found in ESPN schedule" });
    }

    // Fetch full game summary
    const summary = await fetchJson(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${eventInfo.eventId}`
    );

    const header = summary?.header || {};
    const headerComps = header?.competitions?.[0]?.competitors || [];

    // Build enriched team info from header
    const enrichTeam = (teamInfo, headerComp) => ({
      ...teamInfo,
      logo: headerComp?.team?.logo || headerComp?.team?.logos?.[0]?.href || teamInfo.logo,
      record: headerComp?.record?.[0]?.displayValue || teamInfo.record,
      rank: headerComp?.rank || teamInfo.rank,
      linescores: headerComp?.linescores || [],
      score: headerComp?.score || null,
    });

    const homeHeaderComp = headerComps.find((c) => c.homeAway === "home");
    const awayHeaderComp = headerComps.find((c) => c.homeAway === "away");

    const homeInfo = enrichTeam(eventInfo.homeTeamInfo, homeHeaderComp);
    const awayInfo = enrichTeam(eventInfo.awayTeamInfo, awayHeaderComp);

    // Parse season leaders
    // summary.leaders[0] = home team leaders, summary.leaders[1] = away team leaders
    // Each has leaders[] with 3 entries (PTS, AST, REB or sport equivalent)
    const rawLeaders = summary?.leaders || [];
    const parseTeamLeaders = (leaderCat) => {
      if (!leaderCat) return [];
      return (leaderCat.leaders || []).map((entry) => {
        const topLeader = entry.leaders?.[0] || {};
        const athlete = topLeader.athlete || {};
        const stats = topLeader.statistics || [];
        const primaryStat = stats[0] || {};
        const secondaryStats = stats.slice(1, 3);
        return {
          name: athlete.displayName || athlete.fullName || "",
          jersey: athlete.jersey || "",
          headshot: athlete.headshot?.href || null,
          position: athlete.position?.abbreviation || "",
          primaryStat: {
            label: primaryStat.shortDisplayName || primaryStat.abbreviation || "",
            value: primaryStat.displayValue || "",
          },
          secondaryStats: secondaryStats.map((s) => ({
            label: s.abbreviation || s.shortDisplayName || "",
            value: s.displayValue || "",
          })),
        };
      });
    };

    // leaders array: index 0 = home team (first competitor), index 1 = away team
    const homeLeaders = parseTeamLeaders(rawLeaders[0]);
    const awayLeaders = parseTeamLeaders(rawLeaders[1]);

    // Parse team season stats from boxscore
    const boxscoreTeams = summary?.boxscore?.teams || [];
    const parseTeamStats = (teamData) => {
      const statsRaw = teamData?.statistics || [];
      const statsMap = {};
      statsRaw.forEach((s) => { statsMap[s.name] = { value: s.displayValue, label: s.label || s.name }; });
      return TEAM_STAT_KEYS
        .filter((k) => statsMap[k.key])
        .map((k) => ({ key: k.key, label: k.label, value: statsMap[k.key].value }));
    };

    // boxscore teams: [0] = home, [1] = away (matches competitor order)
    const homeStats = parseTeamStats(boxscoreTeams[0]);
    const awayStats = parseTeamStats(boxscoreTeams[1]);

    // Game meta (venue, broadcast)
    const gameInfo = summary?.gameInfo || {};
    const venue = gameInfo?.venue?.fullName || null;
    const city = gameInfo?.venue?.address?.city ? `${gameInfo.venue.address.city}, ${gameInfo.venue.address.state || ""}`.trim().replace(/,$/, "") : null;

    const result = {
      found: true,
      eventId: eventInfo.eventId,
      home: { ...homeInfo, leaders: homeLeaders, stats: homeStats },
      away: { ...awayInfo, leaders: awayLeaders, stats: awayStats },
      venue,
      city,
    };

    cache.set(cacheKey, { ts: Date.now(), data: result });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/espn/game-stats]", err);
    return NextResponse.json({ error: "Failed to fetch game stats", found: false }, { status: 500 });
  }
}
