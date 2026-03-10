import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const POLY_BASE_URL = "https://gamma-api.polymarket.com/markets";
const KALSHI_BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";
const MAX_LIMIT = 100;
const MAX_FETCH = 200;
const MAX_EVENT_LOOKUPS = 60;
const SUPPORTED_SOURCES = new Set(["polymarket", "kalshi"]);
const KALSHI_AUTH = {
  key:
    process.env.KALSHI_API_KEY ||
    process.env.KALSHI_KEY ||
    process.env.KALSHI_API_TOKEN ||
    "",
  id:
    process.env.KALSHI_API_ID ||
    process.env.KALSHI_KEY_ID ||
    process.env.KALSHI_ACCESS_KEY_ID ||
    "",
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapTextToCategory = (rawText = "") => {
  const normalized = normalizeText(rawText);
  if (!normalized) return "other";

  // Sports + Olympics
  if (
    normalized.includes("sport") ||
    normalized.includes("olympic") ||
    normalized.includes("nba") ||
    normalized.includes("nfl") ||
    normalized.includes("mlb") ||
    normalized.includes("nhl") ||
    normalized.includes("ufc") ||
    normalized.includes("soccer") ||
    normalized.includes("tennis") ||
    normalized.includes("golf")
  ) {
    return "sports";
  }

  if (normalized.includes("election")) return "elections";
  if (normalized.includes("politic") || normalized.includes("currentaffairs") || normalized.includes("government")) {
    return "politics";
  }
  if (
    normalized.includes("popculture") ||
    normalized.includes("entertainment") ||
    normalized.includes("celebrity") ||
    normalized.includes("music") ||
    normalized.includes("movie") ||
    normalized.includes("tv")
  ) {
    return "pop-culture";
  }
  if (normalized.includes("crypto") || normalized.includes("bitcoin") || normalized.includes("ethereum")) {
    return "crypto";
  }
  if (
    normalized.includes("econom") ||
    normalized.includes("finance") ||
    normalized.includes("business") ||
    normalized.includes("tech") ||
    normalized.includes("company") ||
    normalized.includes("inflation") ||
    normalized.includes("fed")
  ) {
    return "economics";
  }
  return "other";
};

const mapPolymarketCategory = (market = {}) => {
  const tags = Array.isArray(market?.tags)
    ? market.tags
        .map((tag) => (typeof tag === "string" ? tag : tag?.label || tag?.name || ""))
        .join(" ")
    : "";
  const eventText = Array.isArray(market?.events)
    ? market.events
        .map((event) => `${event?.title || ""} ${event?.slug || ""} ${event?.ticker || ""} ${event?.category || ""}`)
        .join(" ")
    : "";
  const combined = [
    market?.category,
    market?.question,
    market?.title,
    market?.slug,
    market?.description,
    tags,
    eventText,
  ]
    .filter(Boolean)
    .join(" ");

  return mapTextToCategory(combined);
};

const mapKalshiCategory = ({ market = {}, event = {} } = {}) => {
  const combined = [
    event?.category,
    event?.title,
    event?.subtitle,
    event?.series_ticker,
    market?.title,
    market?.subtitle,
    market?.ticker,
    market?.event_ticker,
  ]
    .filter(Boolean)
    .join(" ");

  return mapTextToCategory(combined);
};

const normalizeMarketTitle = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeOutcomeName = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const groupPredictionMarkets = (markets) => {
  const groups = new Map();

  for (const market of markets || []) {
    const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : [];
    const titleKey = normalizeMarketTitle(market?.title);
    const groupKey = `${market?.category || "other"}::${titleKey || market?.id}`;
    const existing = groups.get(groupKey) || {
      id: groupKey,
      title: market?.title || "Prediction market",
      category: market?.category || "other",
      volume: 0,
      endDate: market?.endDate || null,
      outcomesMap: new Map(),
      sourcesMap: new Map(),
    };

    existing.volume = Math.max(existing.volume || 0, Number(market?.volume || 0));
    existing.endDate = existing.endDate || market?.endDate || null;
    existing.sourcesMap.set(market.source, {
      key: market.source,
      label: market.source,
      url: market.url || null,
      marketId: market.id,
    });

    for (const outcome of outcomes) {
      const name = normalizeOutcomeName(outcome?.name);
      if (!name) continue;
      const existingOutcome = existing.outcomesMap.get(name) || { name, prices: {} };
      existingOutcome.prices[market.source] = {
        price: Number(outcome?.price),
        marketId: market.id,
      };
      existing.outcomesMap.set(name, existingOutcome);
    }

    groups.set(groupKey, existing);
  }

  return Array.from(groups.values())
    .map((group) => ({
      id: group.id,
      title: group.title,
      category: group.category,
      volume: group.volume,
      endDate: group.endDate,
      sources: Array.from(group.sourcesMap.values()),
      outcomes: Array.from(group.outcomesMap.values()),
    }))
    .sort((a, b) => (b.volume || 0) - (a.volume || 0));
};

const buildPolymarketMarkets = (markets, { category, search, limit }) => {
  const searchNormalized = normalizeText(search);
  const filtered = (markets || [])
    .filter((market) => market && market.active && !market.closed && !market.archived)
    .map((market) => {
      const outcomes = safeJsonParse(market.outcomes, []);
      const prices = safeJsonParse(market.outcomePrices, []);
      const normalizedCategory = mapPolymarketCategory(market);
      const parsedOutcomes = (outcomes || [])
        .map((name, idx) => {
          const rawPrice = prices?.[idx];
          const priceValue = Number(rawPrice);
          if (!Number.isFinite(priceValue)) return null;
          return { name, price: priceValue };
        })
        .filter(Boolean);

      return {
        id: `polymarket_${market.id}`,
        source: "polymarket",
        title: market.question || market.title || market.slug || "Polymarket market",
        category: normalizedCategory,
        outcomes: parsedOutcomes,
        volume: Number(market.volumeNum || market.volume || 0),
        endDate: market.endDate || market.endDateIso || null,
        url: market.slug ? `https://polymarket.com/market/${market.slug}` : "https://polymarket.com",
      };
    })
    .filter((market) => {
      if (category && market.category !== category) return false;
      if (searchNormalized) {
        return normalizeText(market.title).includes(searchNormalized);
      }
      return true;
    });

  return filtered
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, limit);
};

const fetchPolymarket = async ({ category, search, limit }) => {
  const fetchLimit = Math.min(Math.max(limit * 4, 50), MAX_FETCH);
  const url = new URL(POLY_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", String(fetchLimit));

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Polymarket markets");
  }
  const data = await res.json();
  return buildPolymarketMarkets(data, { category, search, limit });
};

const getKalshiYesPrice = (market) => {
  if (market?.yes_ask_dollars !== undefined && market.yes_ask_dollars !== null) {
    const parsed = Number(market.yes_ask_dollars);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (market?.yes_ask !== undefined && market.yes_ask !== null) {
    const parsed = Number(market.yes_ask);
    if (Number.isFinite(parsed)) return parsed / 100;
  }
  if (market?.last_price !== undefined && market.last_price !== null) {
    const parsed = Number(market.last_price);
    if (Number.isFinite(parsed)) return parsed / 100;
  }
  return null;
};

const fetchKalshiEvent = async (eventTicker) => {
  const url = `${KALSHI_BASE_URL}/events/${eventTicker}`;
  const res = await fetchKalshiJson(url);
  if (!res.ok) {
    return null;
  }
  const data = await res.json().catch(() => null);
  return data?.event || null;
};

const fetchKalshiJson = async (url) => {
  const headers = {};
  if (KALSHI_AUTH.key && KALSHI_AUTH.id) {
    headers["X-API-KEY"] = KALSHI_AUTH.key;
    headers["X-API-KEY-ID"] = KALSHI_AUTH.id;
  } else if (KALSHI_AUTH.key) {
    headers.Authorization = `Bearer ${KALSHI_AUTH.key}`;
  }

  const useAuth = Object.keys(headers).length > 0;
  let res = await fetch(url, { cache: "no-store", headers: useAuth ? headers : undefined });
  if (useAuth && (res.status === 401 || res.status === 403)) {
    res = await fetch(url, { cache: "no-store" });
  }
  return res;
};

const fetchKalshi = async ({ category, search, limit }) => {
  const fetchLimit = Math.min(Math.max(limit * 4, 50), MAX_FETCH);
  const url = new URL(`${KALSHI_BASE_URL}/markets`);
  url.searchParams.set("limit", String(fetchLimit));

  const res = await fetchKalshiJson(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Kalshi markets");
  }
  const data = await res.json().catch(() => ({}));
  const markets = (data.markets || []).filter((market) => market?.status === "active");

  const searchNormalized = normalizeText(search);
  const filteredMarkets = searchNormalized
    ? markets.filter((market) => {
        const title = `${market.title || ""} ${market.subtitle || ""} ${market.ticker || ""}`;
        return normalizeText(title).includes(searchNormalized);
      })
    : markets;

  const eventTickers = Array.from(
    new Set(filteredMarkets.map((market) => market.event_ticker).filter(Boolean))
  ).slice(0, MAX_EVENT_LOOKUPS);

  const eventLookup = {};
  await Promise.all(
    eventTickers.map(async (ticker) => {
      const event = await fetchKalshiEvent(ticker);
      if (event) {
        eventLookup[ticker] = event;
      }
    })
  );

  const normalizedMarkets = filteredMarkets
    .map((market) => {
      const event = eventLookup[market.event_ticker];
      const mappedCategory = mapKalshiCategory({ market, event });
      const yesPrice = getKalshiYesPrice(market);
      const outcomes = [];
      if (Number.isFinite(yesPrice)) {
        const clipped = Math.max(0, Math.min(1, yesPrice));
        outcomes.push({ name: "Yes", price: clipped });
        outcomes.push({ name: "No", price: 1 - clipped });
      }
      const volume = Number(market.volume_24h_fp || market.volume_fp || market.volume || 0);
      return {
        id: `kalshi_${market.ticker}`,
        source: "kalshi",
        title: market.title || event?.title || market.ticker || "Kalshi market",
        category: mappedCategory,
        outcomes,
        volume,
        endDate: market.close_time || market.expiration_time || null,
        url: market.event_ticker ? `https://kalshi.com/markets/${market.event_ticker}` : "https://kalshi.com",
      };
    })
    .filter((market) => {
      if (category && market.category !== category) return false;
      return true;
    });

  return normalizedMarkets
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, limit);
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "").toLowerCase();
  const limitRaw = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 5), MAX_LIMIT) : 50;
  const search = searchParams.get("search") || "";
  const sourcesParam = searchParams.get("sources") || "polymarket,kalshi";
  const requestedSources = sourcesParam
    .split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
  const sources = requestedSources.filter((source) => SUPPORTED_SOURCES.has(source));

  const cacheKey = JSON.stringify({ category, limit, search, sources });
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const errors = {};
  const results = [];

  if (sources.includes("polymarket")) {
    try {
      const data = await fetchPolymarket({ category, search, limit });
      results.push(...data);
    } catch (error) {
      errors.polymarket = error?.message || "Failed to fetch Polymarket";
    }
  }

  if (sources.includes("kalshi")) {
    try {
      const data = await fetchKalshi({ category, search, limit });
      results.push(...data);
    } catch (error) {
      errors.kalshi = error?.message || "Failed to fetch Kalshi";
    }
  }

  const sortedMarkets = results
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, limit);

  const data = {
    markets: sortedMarkets,
    groupedMarkets: groupPredictionMarkets(sortedMarkets),
    errors,
    requestedSources,
    supportedSources: Array.from(SUPPORTED_SOURCES),
    rejectedSources: requestedSources.filter((source) => !SUPPORTED_SOURCES.has(source)),
  };

  cache.set(cacheKey, { ts: now, data });
  return NextResponse.json(data);
}
