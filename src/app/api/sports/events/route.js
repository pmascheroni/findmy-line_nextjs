import { NextResponse } from "next/server";
import { ALL_CATEGORIES } from "@/lib/sportsCatalog";

export const dynamic = "force-dynamic";

const cache = new Map();
const TTL_MS = 2 * 60 * 1000;

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

function normalizeEvent(event, categoryId) {
  return {
    id: event?.id,
    name: event?.name || event?.shortName || "Event",
    shortName: event?.shortName || event?.name || "Event",
    date: event?.date,
    status: event?.status?.type?.shortDetail || event?.status?.type?.description || null,
    categoryId,
  };
}

async function fetchEspnEvents(path, dateParam) {
  const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`);
  if (dateParam) {
    url.searchParams.set("dates", dateParam);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data?.events) ? data.events : [];
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const tzOffsetParam = searchParams.get("tzOffset");
  const tzOffset = tzOffsetParam ? Number(tzOffsetParam) : null;
  const dateParam = toEspnDate(searchParams.get("date"), tzOffset);

  if (!categoryId) {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }

  const category = ALL_CATEGORIES.find((item) => item.id === categoryId);
  if (!category || !category.espnPaths) {
    return NextResponse.json({ error: "Category not supported" }, { status: 400 });
  }

  const cacheKey = `${categoryId}:${dateParam || "today"}:${tzOffset ?? "local"}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const events = [];
  for (const path of category.espnPaths) {
    const data = await fetchEspnEvents(path, dateParam);
    data.forEach((event) => {
      events.push(normalizeEvent(event, categoryId));
    });
  }

  const payload = { categoryId, events };
  cache.set(cacheKey, { ts: now, data: payload });
  return NextResponse.json(payload);
}
