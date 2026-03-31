import { NextResponse } from "next/server";
import { ALL_CATEGORIES } from "@/lib/sportsCatalog";

export const dynamic = "force-dynamic";

const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

function toEspnDate(dateValue, tzOffsetMinutes = null) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : date.getTimezoneOffset();
  const localMs = date.getTime() - offset * 60 * 1000;
  const local = new Date(localMs);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function addDays(dateStr, days) {
  // dateStr is YYYYMMDD
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const d = new Date(Date.UTC(year, month, day + days));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dy}`;
}

function espnDateToIso(espnDate) {
  // YYYYMMDD -> YYYY-MM-DD
  return `${espnDate.slice(0, 4)}-${espnDate.slice(4, 6)}-${espnDate.slice(6, 8)}`;
}

function normalizeEvent(event, categoryId) {
  const competitors = event?.competitions?.[0]?.competitors || [];
  const homeComp = competitors.find((c) => c.homeAway === "home");
  const awayComp = competitors.find((c) => c.homeAway === "away");
  return {
    id: event?.id,
    name: event?.name || event?.shortName || "Event",
    shortName: event?.shortName || event?.name || "Event",
    date: event?.date,
    status: event?.status?.type?.shortDetail || event?.status?.type?.description || null,
    categoryId,
    homeTeam: homeComp?.team?.displayName || homeComp?.team?.name || null,
    awayTeam: awayComp?.team?.displayName || awayComp?.team?.name || null,
    homeAbbrev: homeComp?.team?.abbreviation || null,
    awayAbbrev: awayComp?.team?.abbreviation || null,
    homeScore: homeComp?.score ?? null,
    awayScore: awayComp?.score ?? null,
    homeLogo: homeComp?.team?.logo || null,
    awayLogo: awayComp?.team?.logo || null,
    venue: event?.competitions?.[0]?.venue?.fullName || null,
  };
}

async function fetchEspnEventsForDate(espnPath, dateParam) {
  const cacheKey = `espn:${espnPath}:${dateParam}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return cached.data;
  }

  try {
    const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard`);
    if (dateParam) {
      url.searchParams.set("dates", dateParam);
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      cache.set(cacheKey, { ts: now, data: [] });
      return [];
    }
    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    cache.set(cacheKey, { ts: now, data: events });
    return events;
  } catch {
    return [];
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const tzOffsetParam = searchParams.get("tzOffset");
  const tzOffset = tzOffsetParam ? Number(tzOffsetParam) : null;
  const startDateParam = searchParams.get("startDate");
  const daysParam = searchParams.get("days");
  const days = daysParam ? Math.min(Math.max(Number(daysParam), 1), 30) : 7;

  if (!categoryId) {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }

  const category = ALL_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  // If no espnPaths, return empty (outright/futures sports)
  if (!category.espnPaths || category.espnPaths.length === 0) {
    return NextResponse.json({ days: [], categoryId });
  }

  const startDate = toEspnDate(startDateParam || new Date().toISOString(), tzOffset);
  if (!startDate) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  // Build array of dates to fetch
  const datesToFetch = Array.from({ length: days }, (_, i) => addDays(startDate, i));

  // Fetch all dates in parallel
  const results = await Promise.all(
    datesToFetch.map(async (espnDate) => {
      const isoDate = espnDateToIso(espnDate);
      const dateObj = new Date(`${isoDate}T12:00:00Z`);

      // Fetch from all ESPN paths for this category
      const allEvents = [];
      await Promise.all(
        category.espnPaths.map(async (path) => {
          const events = await fetchEspnEventsForDate(path, espnDate);
          events.forEach((event) => {
            allEvents.push(normalizeEvent(event, categoryId));
          });
        })
      );

      return {
        espnDate,
        isoDate,
        dateObj,
        events: allEvents,
      };
    })
  );

  // Filter to only days with events, build label
  const today = toEspnDate(new Date().toISOString(), tzOffset);
  const tomorrowDate = addDays(today, 1);

  const daysWithEvents = results
    .filter((r) => r.events.length > 0)
    .map((r) => {
      let label;
      if (r.espnDate === today) {
        label = "Today";
      } else if (r.espnDate === tomorrowDate) {
        label = "Tomorrow";
      } else {
        // Day of week
        label = r.dateObj.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      }
      // Format display date: "April 5"
      const displayDate = r.dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      return {
        date: r.isoDate,
        espnDate: r.espnDate,
        label,
        displayDate,
        events: r.events,
      };
    });

  return NextResponse.json({ categoryId, days: daysWithEvents, startDate, fetchedDays: days });
}
