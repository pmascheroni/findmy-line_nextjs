import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cache = { ts: 0, data: null };
const TTL_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const apiKey = (process.env.ODDS_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const now = Date.now();
  if (cache.data && now - cache.ts < TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const baseUrl = (process.env.ODDS_API_BASE_URL || "https://api.the-odds-api.com/v4").trim();
  const url = new URL(`${baseUrl}/sports`);
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || "Failed to fetch sports list" }, { status: 500 });
  }

  const sports = await res.json();
  const data = { sports };
  cache.ts = now;
  cache.data = data;
  return NextResponse.json(data);
}
