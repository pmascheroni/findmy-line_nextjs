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

async function fetchEspnCount(path, dateParam) {
  const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`);
  if (dateParam) {
    url.searchParams.set("dates", dateParam);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return 0;
  }
  const data = await res.json();
  return Array.isArray(data?.events) ? data.events.length : 0;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tzOffsetParam = searchParams.get("tzOffset");
  const tzOffset = tzOffsetParam ? Number(tzOffsetParam) : null;
  const dateParam = toEspnDate(searchParams.get("date"), tzOffset);
  const cacheKey = `${dateParam || "today"}:${tzOffset ?? "local"}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const counts = {};
  await Promise.all(
    ALL_CATEGORIES.map(async (category) => {
      const paths = category.espnPaths || [];
      let total = 0;
      for (const path of paths) {
        total += await fetchEspnCount(path, dateParam);
      }
      counts[category.id] = total;
    })
  );

  const data = { date: dateParam, counts };
  cache.set(cacheKey, { ts: now, data });
  return NextResponse.json(data);
}
