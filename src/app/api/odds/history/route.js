import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const eventId = searchParams.get("eventId");
  const market = searchParams.get("market") || "h2h";
  const bookmakers = searchParams.get("bookmakers") || "draftkings,fanduel,betmgm,williamhill_us,espnbet";

  if (!sport || !eventId) {
    return NextResponse.json({ points: [], error: "sport and eventId are required" }, { status: 400 });
  }

  const apiKey = (process.env.ODDS_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ points: [], error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const baseUrl = (process.env.ODDS_API_BASE_URL || "https://api.the-odds-api.com/v4").trim();

  try {
    const url = new URL(`${baseUrl}/sports/${sport}/events/${eventId}/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", "us");
    url.searchParams.set("markets", market);
    url.searchParams.set("oddsFormat", "american");
    url.searchParams.set("dateFormat", "iso");
    url.searchParams.set("bookmakers", bookmakers);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ points: [], error: `Odds API ${res.status}: ${text}` });
    }

    const data = await res.json();
    const timestamp = new Date().toISOString();
    const points = [];

    (data.bookmakers || []).forEach((book) => {
      const mkt = (book.markets || []).find((m) => m.key === market);
      if (!mkt) return;
      (mkt.outcomes || []).forEach((outcome) => {
        points.push({
          timestamp,
          sportsbook: book.key,
          outcome: outcome.name,
          odds: outcome.price,
          market,
          point: outcome.point,
        });
      });
    });

    return NextResponse.json({ points, gameId: data.id, sport: data.sport_key });
  } catch (err) {
    return NextResponse.json({ points: [], error: err?.message || "Failed to fetch" });
  }
}