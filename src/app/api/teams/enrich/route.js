import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const ENRICHMENT_TOKEN = process.env.ENRICHMENT_INTERNAL_TOKEN || "internal-token-required";

function validateInternalToken(request) {
  const token = request.headers.get("x-internal-token");
  if (!token || token !== ENRICHMENT_TOKEN) {
    return false;
  }
  return true;
}

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
  soccer_conmebol_copa_libertadores: "soccer/conmebol.libertadores",
  soccer_fifa_world_cup: "soccer/fifa.world",
};

// In-memory cache for ESPN teams lists (24h TTL)
const teamsListCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FindMyLine/1.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

function normalizeWords(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function teamsMatchStrict(espnName = "", queryName = "") {
  const ew = normalizeWords(espnName);
  const qw = normalizeWords(queryName);
  if (!ew.length || !qw.length) return false;
  const matched = qw.filter((q) =>
    ew.some((e) => e === q || (e.length > 4 && q.length > 4 && (e.includes(q) || q.includes(e))))
  );
  return matched.length >= Math.ceil(qw.length * 0.7);
}

async function findTeamInESPN(sportPath, teamName) {
  // Check cache
  const cacheKey = sportPath;
  const cached = teamsListCache.get(cacheKey);
  let allTeams;

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    allTeams = cached.data;
  } else {
    const data = await fetchJson(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams?limit=500`
    );
    allTeams = (data?.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => t.team || t);
    teamsListCache.set(cacheKey, { ts: Date.now(), data: allTeams });
  }

  // Strict match first
  let match = allTeams.find(
    (t) =>
      teamsMatchStrict(t.displayName, teamName) ||
      teamsMatchStrict(t.shortDisplayName, teamName) ||
      teamsMatchStrict(t.nickname, teamName)
  );

  if (!match) {
    // Fuzzy fallback: any word overlap
    const qw = normalizeWords(teamName);
    match = allTeams.find((t) => {
      const candidates = [t.displayName, t.shortDisplayName, t.nickname].filter(Boolean);
      return candidates.some((c) => {
        const cw = normalizeWords(c);
        return qw.some((q) => cw.some((e) => e === q));
      });
    });
  }

  if (!match) return null;

  return {
    espn_id: match.id,
    name: match.displayName,
    short_name: match.shortDisplayName || match.nickname || match.abbreviation,
    abbreviation: match.abbreviation,
    logo_url: match.logos?.[0]?.href || null,
    color: match.color ? `#${match.color}` : null,
    alternateColor: match.alternateColor ? `#${match.alternateColor}` : null,
    location: match.location || null,
  };
}

// For individual sports (UFC/MMA fighters, golf players), try to get headshot/flag
async function findAthleteInESPN(sportPath, athleteName) {
  try {
    // ESPN athlete search
    const data = await fetchJson(
      `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(athleteName)}&limit=5&type=player`
    );
    const items = data?.items || data?.results || [];
    const match = items.find((item) => {
      const name = item.displayName || item.name || "";
      return normalizeWords(name).join(" ") === normalizeWords(athleteName).join(" ");
    });

    if (!match) return null;

    return {
      espn_id: match.id,
      name: match.displayName || match.name,
      headshot_url: match.headshot?.href || match.image || null,
      country: match.citizenship || match.flag?.alt || null,
      flag_url: match.flag?.href || null,
    };
  } catch {
    return null;
  }
}

// Country code to flag emoji (for golf players)
function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return null;
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export async function POST(request) {
  // Validate internal token for security
  if (!validateInternalToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { teamName, sportKey } = body;

    if (!teamName || !sportKey) {
      return NextResponse.json({ error: "teamName and sportKey required" }, { status: 400 });
    }

    const sportPath = SPORT_PATH_MAP[sportKey];
    const isIndividualSport =
      sportKey.startsWith("golf_") ||
      sportKey.startsWith("mma_") ||
      sportKey.startsWith("tennis_") ||
      sportKey.startsWith("boxing_");

    let enrichedData = null;

    if (sportPath && !isIndividualSport) {
      // Team sport: find team in ESPN teams list
      enrichedData = await findTeamInESPN(sportPath, teamName);
    } else if (isIndividualSport) {
      // Individual sport: find athlete
      const athlete = await findAthleteInESPN(sportPath || "", teamName);
      if (athlete) {
        enrichedData = {
          name: athlete.name || teamName,
          logo_url: athlete.headshot_url,
          headshot_url: athlete.headshot_url,
          country: athlete.country,
          flag_url: athlete.flag_url,
        };
      }
    }

    if (!enrichedData) {
      return NextResponse.json({ found: false, teamName });
    }

    // Write to Firebase
    const adminFirestore = getAdminFirestore();
    if (adminFirestore) {
      const docId = `${sportKey}__${teamName.replace(/[/\\#$.[\]]/g, "_")}`;
      const docRef = adminFirestore.collection("Teams").doc(docId);
      const existing = await docRef.get();

      const writeData = {
        name: teamName,
        sport_key: sportKey,
        ...enrichedData,
        updated_at: new Date().toISOString(),
      };

      if (!existing.exists) {
        writeData.created_at = new Date().toISOString();
        await docRef.set(writeData);
      } else {
        // Only update fields that are currently missing
        const existingData = existing.data();
        const updates = {};
        for (const [key, value] of Object.entries(writeData)) {
          if (value && !existingData[key]) {
            updates[key] = value;
          }
        }
        // Always update timestamp
        updates.updated_at = writeData.updated_at;
        if (Object.keys(updates).length > 1) {
          await docRef.update(updates);
        }
      }
    }

    return NextResponse.json({
      found: true,
      team: { ...enrichedData, name: teamName, sport_key: sportKey },
    });
  } catch (err) {
    console.error("[api/teams/enrich]", err);
    return NextResponse.json({ error: "Failed to enrich team" }, { status: 500 });
  }
}
