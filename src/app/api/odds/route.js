import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requestCache = new Map();
const requestInflight = new Map();
const sportCache = new Map();
const sportInflight = new Map();
const errorLogCache = new Map();
const REQUEST_TTL_MS = 60 * 1000;
const SPORT_TTL_MS = 2 * 60 * 1000;
const LOG_TTL_MS = 60 * 1000;

function getUtcDayRange(dateValue, tzOffsetMinutes = null) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : date.getTimezoneOffset();
  const localMs = date.getTime() - offset * 60 * 1000;
  const local = new Date(localMs);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  const startUtcMs = Date.UTC(year, month, day, 0, 0, 0) + offset * 60 * 1000;
  const endUtcMs = Date.UTC(year, month, day, 23, 59, 59) + offset * 60 * 1000;
  const format = (value) => value.toISOString().replace(/\.\d{3}Z$/, "Z");
  return {
    from: format(new Date(startUtcMs)),
    to: format(new Date(endUtcMs)),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sportsParam = searchParams.get("sports") || "";
  const sports = sportsParam.split(",").map((s) => s.trim()).filter(Boolean);
  const marketsMode = searchParams.get("marketsMode") === "1";
  const sportsbooks = searchParams.get("sportsbooks") || "";
  const predictionMarkets = searchParams.get("predictionMarkets") || "";
  const dateParam = searchParams.get("date");
  const tzOffsetParam = searchParams.get("tzOffset");
  const tzOffset = tzOffsetParam ? Number(tzOffsetParam) : null;

  if (!sports.length) {
    return NextResponse.json({ error: "Missing sports list" }, { status: 400 });
  }

  const apiKey = (process.env.ODDS_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const baseUrl = (process.env.ODDS_API_BASE_URL || "https://api.the-odds-api.com/v4").trim();
  const regions = process.env.ODDS_API_REGIONS || "us";
  const markets = process.env.ODDS_API_MARKETS || "h2h,spreads,totals";
  const oddsFormat = process.env.ODDS_API_ODDS_FORMAT || "american";
  const dateFormat = process.env.ODDS_API_DATE_FORMAT || "iso";
  const range = getUtcDayRange(dateParam, tzOffset);
  const bookmakers = marketsMode ? predictionMarkets : sportsbooks;

  const sortedSports = [...sports].sort();
  const requestKey = JSON.stringify({
    sports: sortedSports,
    marketsMode,
    sportsbooks: bookmakers,
    range,
    regions,
    markets,
    oddsFormat,
    dateFormat,
  });

  const now = Date.now();
  const cached = requestCache.get(requestKey);
  if (cached && now - cached.ts < REQUEST_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  if (requestInflight.has(requestKey)) {
    return NextResponse.json(await requestInflight.get(requestKey));
  }

  const fetchPromise = (async () => {
    const games = [];
    const errors = [];

    for (const sport of sortedSports) {
      const sportKey = JSON.stringify({
        sport,
        marketsMode,
        bookmakers,
        range,
        regions,
        markets,
        oddsFormat,
        dateFormat,
      });

      const sportCached = sportCache.get(sportKey);
      if (sportCached && now - sportCached.ts < SPORT_TTL_MS) {
        games.push(...sportCached.data);
        continue;
      }

      if (sportInflight.has(sportKey)) {
        const inflightData = await sportInflight.get(sportKey);
        games.push(...inflightData);
        continue;
      }

      const sportPromise = (async () => {
        const url = new URL(`${baseUrl}/sports/${sport}/odds`);
        url.searchParams.set("apiKey", apiKey);
        url.searchParams.set("regions", regions);
        url.searchParams.set("markets", markets);
        url.searchParams.set("oddsFormat", oddsFormat);
        url.searchParams.set("dateFormat", dateFormat);
        if (bookmakers) {
          url.searchParams.set("bookmakers", bookmakers);
        }
        if (range) {
          url.searchParams.set("commenceTimeFrom", range.from);
          url.searchParams.set("commenceTimeTo", range.to);
        }

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          const logKey = `${sport}-${res.status}`;
          const lastLog = errorLogCache.get(logKey);
          if (!lastLog || now - lastLog > LOG_TTL_MS) {
            console.error(
              "[odds] upstream error",
              res.status,
              url.toString().replace(apiKey, "[redacted]")
            );
            errorLogCache.set(logKey, now);
          }
          throw new Error(`Odds API ${res.status}: ${text}`);
        }
        return res.json();
      })();

      sportInflight.set(sportKey, sportPromise);
      try {
        const data = await sportPromise;
        const normalized = Array.isArray(data) ? data : [];
        sportCache.set(sportKey, { ts: Date.now(), data: normalized });
        games.push(...normalized);
      } catch (error) {
        errors.push(error?.message || "Unknown error");
      } finally {
        sportInflight.delete(sportKey);
      }
    }

    const data = { games, errors };
    requestCache.set(requestKey, { ts: Date.now(), data });
    return data;
  })();

  requestInflight.set(requestKey, fetchPromise);
  try {
    return NextResponse.json(await fetchPromise);
  } finally {
    requestInflight.delete(requestKey);
  }
}
