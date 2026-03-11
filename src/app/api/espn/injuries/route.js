import { NextResponse } from "next/server";

const SPORT_CONFIG = {
  americanfootball_nfl: { scoreboardPath: "football/nfl", league: "football/leagues/nfl" },
  americanfootball_ncaaf: { scoreboardPath: "football/college-football", league: "football/leagues/college-football" },
  basketball_nba: { scoreboardPath: "basketball/nba", league: "basketball/leagues/nba" },
  basketball_ncaab: { scoreboardPath: "basketball/mens-college-basketball", league: "basketball/leagues/mens-college-basketball" },
  baseball_mlb: { scoreboardPath: "baseball/mlb", league: "baseball/leagues/mlb" },
  icehockey_nhl: { scoreboardPath: "hockey/nhl", league: "hockey/leagues/nhl" },
};

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
  return gameWords.some((gameWord) =>
    espnWords.some((espnWord) => espnWord.includes(gameWord) || gameWord.includes(espnWord))
  );
};

const normalizeRef = (ref) => ref?.replace(/^http:/, "https:");

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "FindMyLine/1.0",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchTeamInjuries({ leaguePath, teamId, fallbackName = "", fallbackLogo = null }) {
  if (!teamId) {
    return {
      teamName: fallbackName,
      logo: fallbackLogo,
      injuries: [],
    };
  }

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
          injuryData?.details?.type ||
          injuryData?.details?.detail ||
          injuryData?.shortComment ||
          null,
        returnDate: injuryData?.details?.returnDate || injuryData?.date || null,
        headshot: athleteData?.headshot?.href || null,
        comment: injuryData?.shortComment || injuryData?.longComment || null,
      };
    })
  );

  return {
    teamName: fallbackName,
    logo: fallbackLogo,
    injuries: injuryDetails,
  };
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
      home: { teamName: homeTeam, logo: null, injuries: [] },
      away: { teamName: awayTeam, logo: null, injuries: [] },
      unsupported: true,
    });
  }

  try {
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/${config.scoreboardPath}/scoreboard`;
    const scoreboardData = await fetchJson(scoreboardUrl);
    const events = scoreboardData?.events || [];

    const matchedEvent = events.find((event) => {
      const competition = event?.competitions?.[0];
      const competitors = competition?.competitors || [];
      const homeComp = competitors.find((comp) => comp.homeAway === "home");
      const awayComp = competitors.find((comp) => comp.homeAway === "away");

      if (!homeComp || !awayComp) return false;

      const homeNames = [homeComp.team?.displayName, homeComp.team?.shortDisplayName, homeComp.team?.name].filter(Boolean);
      const awayNames = [awayComp.team?.displayName, awayComp.team?.shortDisplayName, awayComp.team?.name].filter(Boolean);

      return homeNames.some((name) => teamsMatch(name, homeTeam)) && awayNames.some((name) => teamsMatch(name, awayTeam));
    });

    if (!matchedEvent) {
      return NextResponse.json({
        home: { teamName: homeTeam, logo: null, injuries: [] },
        away: { teamName: awayTeam, logo: null, injuries: [] },
        foundGame: false,
      });
    }

    const competition = matchedEvent.competitions?.[0];
    const competitors = competition?.competitors || [];
    const homeComp = competitors.find((comp) => comp.homeAway === "home");
    const awayComp = competitors.find((comp) => comp.homeAway === "away");

    const [home, away] = await Promise.all([
      fetchTeamInjuries({
        leaguePath: config.league,
        teamId: homeComp?.team?.id,
        fallbackName: homeComp?.team?.displayName || homeTeam,
        fallbackLogo: homeComp?.team?.logo || homeComp?.team?.logos?.[0]?.href || null,
      }),
      fetchTeamInjuries({
        leaguePath: config.league,
        teamId: awayComp?.team?.id,
        fallbackName: awayComp?.team?.displayName || awayTeam,
        fallbackLogo: awayComp?.team?.logo || awayComp?.team?.logos?.[0]?.href || null,
      }),
    ]);

    return NextResponse.json({ home, away, foundGame: true });
  } catch (error) {
    console.error("[api/espn/injuries]", error);
    return NextResponse.json({ error: "Failed to fetch ESPN injuries" }, { status: 500 });
  }
}
