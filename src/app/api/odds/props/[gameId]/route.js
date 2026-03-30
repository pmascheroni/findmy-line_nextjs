// src/app/api/odds/props/[gameId]/route.js
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

// Map prop market keys to display names and categories
const PROP_MARKETS = {
  // Player props - points/rebs/assists
  player_points: { name: "Player Points", category: "Player Props" },
  player_rebounds: { name: "Player Rebounds", category: "Player Props" },
  player_assists: { name: "Player Assists", category: "Player Props" },
  player_threes: { name: "Player 3-Pointers", category: "Player Props" },
  player_points_rebounds_assists: { name: "Player PTS+REB+AST", category: "Player Props" },
  
  // Football player props
  player_pass_yds: { name: "Passing Yards", category: "Player Props" },
  player_pass_tds: { name: "Passing TDs", category: "Player Props" },
  player_rush_yds: { name: "Rushing Yards", category: "Player Props" },
  player_receive_yds: { name: "Receiving Yards", category: "Player Props" },
  player_receptions: { name: "Receptions", category: "Player Props" },
  player_anytime_td: { name: "Anytime TD", category: "Player Props" },
  
  // Baseball player props
  batter_home_runs: { name: "Home Runs", category: "Player Props" },
  batter_hits: { name: "Hits", category: "Player Props" },
  batter_rbis: { name: "RBIs", category: "Player Props" },
  pitcher_strikeouts: { name: "Pitcher Strikeouts", category: "Player Props" },
  
  // Hockey/soccer player props
  player_goals: { name: "Player Goals", category: "Player Props" },
  player_shots_on_goal: { name: "Shots on Goal", category: "Player Props" },
  
  // Game props
  alternate_spreads: { name: "Alternate Spreads", category: "Game Props" },
  alternate_totals: { name: "Alternate Totals", category: "Game Props" },
  team_totals_home: { name: "Home Team Total", category: "Game Props" },
  team_totals_away: { name: "Away Team Total", category: "Game Props" },
  
  // Special props
  player_points_alternate: { name: "Alternate Player Points", category: "Player Props" },
  player_rebounds_alternate: { name: "Alternate Player Rebounds", category: "Player Props" },
  player_assists_alternate: { name: "Alternate Player Assists", category: "Player Props" },
};

// Sports that support player props
const SPORTS_WITH_PROPS = [
  'basketball_nba',
  'basketball_ncaab',
  'americanfootball_nfl',
  'americanfootball_ncaaf',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
  'soccer_usa_mls'
];

export async function GET(request, { params }) {
  const { gameId } = params;
  const { searchParams } = new URL(request.url);
  
  const apiKey = (process.env.ODDS_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ODDS_API_KEY not configured" }, { status: 500 });
  }

  const baseUrl = (process.env.ODDS_API_BASE_URL || "https://api.the-odds-api.com/v4").trim();
  const regions = process.env.ODDS_API_REGIONS || "us";
  const oddsFormat = process.env.ODDS_API_ODDS_FORMAT || "american";
  const dateFormat = process.env.ODDS_API_DATE_FORMAT || "iso";
  
  // Get date and timezone for range
  const dateParam = searchParams.get("date");
  const tzOffsetParam = searchParams.get("tzOffset");
  const tzOffset = tzOffsetParam ? Number(tzOffsetParam) : null;
  const range = getUtcDayRange(dateParam, tzOffset);
  
  // Get sport key to determine which props to include
  const sportKey = searchParams.get("sportKey");
  const includeAllProps = searchParams.get("all") === "1";
  
  // Determine which prop markets to fetch based on sport
  let propMarketsToFetch = [];
  
  if (sportKey) {
    // Basketball props
    if (sportKey.includes('basketball')) {
      propMarketsToFetch = [
        'player_points', 'player_rebounds', 'player_assists', 'player_threes',
        'player_points_rebounds_assists', 'alternate_spreads', 'alternate_totals',
        'team_totals_home', 'team_totals_away'
      ];
    }
    
    // Football props
    if (sportKey.includes('americanfootball')) {
      propMarketsToFetch = [
        'player_pass_yds', 'player_pass_tds', 'player_rush_yds', 'player_receive_yds',
        'player_receptions', 'player_anytime_td', 'alternate_spreads', 'alternate_totals',
        'team_totals_home', 'team_totals_away'
      ];
    }
    
    // Baseball props
    if (sportKey.includes('baseball')) {
      propMarketsToFetch = [
        'batter_home_runs', 'batter_hits', 'batter_rbis', 'pitcher_strikeouts',
        'alternate_totals', 'team_totals_home', 'team_totals_away'
      ];
    }
    
    // Hockey props
    if (sportKey.includes('icehockey')) {
      propMarketsToFetch = [
        'player_goals', 'player_shots_on_goal', 'alternate_totals',
        'team_totals_home', 'team_totals_away'
      ];
    }
    
    // Soccer props
    if (sportKey.includes('soccer')) {
      propMarketsToFetch = [
        'player_goals', 'player_shots_on_goal', 'alternate_totals',
        'team_totals_home', 'team_totals_away'
      ];
    }
  }
  
  if (includeAllProps) {
    propMarketsToFetch = Object.keys(PROP_MARKETS);
  }
  
  if (propMarketsToFetch.length === 0) {
    return NextResponse.json({ groupedProps: [] });
  }
  
  const markets = propMarketsToFetch.join(',');
  
  try {
    // Fetch odds for this specific event
    const url = new URL(`${baseUrl}/sports/${sportKey}/events/${gameId}/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", regions);
    url.searchParams.set("markets", markets);
    url.searchParams.set("oddsFormat", oddsFormat);
    url.searchParams.set("dateFormat", dateFormat);
    
    // Add date range if provided
    if (range) {
      url.searchParams.set("commenceTimeFrom", range.from);
      url.searchParams.set("commenceTimeTo", range.to);
    }
    
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`Odds API error for game ${gameId}: ${res.status} ${text}`);
      
      // Return empty but structure for UI
      return NextResponse.json({ groupedProps: [] });
    }
    
    const eventData = await res.json();
    
    // Group props by market type
    const groupedProps = {};
    
    (eventData.bookmakers || []).forEach((bookmaker) => {
      (bookmaker.markets || []).forEach((market) => {
        const marketInfo = PROP_MARKETS[market.key];
        if (!marketInfo) return;
        
        const category = marketInfo.category;
        const marketName = marketInfo.name;
        
        if (!groupedProps[category]) {
          groupedProps[category] = {};
        }
        
        if (!groupedProps[category][marketName]) {
          groupedProps[category][marketName] = {
            marketKey: market.key,
            outcomes: {},
            bookmakers: {}
          };
        }
        
        // Initialize bookmaker in this market
        if (!groupedProps[category][marketName].bookmakers[bookmaker.key]) {
          groupedProps[category][marketName].bookmakers[bookmaker.key] = {
            title: bookmaker.title,
            outcomes: {}
          };
        }
        
        // Add outcomes for this bookmaker
        (market.outcomes || []).forEach((outcome) => {
          const outcomeKey = `${outcome.name}|${outcome.point || ''}`;
          
          if (!groupedProps[category][marketName].outcomes[outcomeKey]) {
            groupedProps[category][marketName].outcomes[outcomeKey] = {
              name: outcome.name,
              point: outcome.point,
              bookmakers: {}
            };
          }
          
          groupedProps[category][marketName].outcomes[outcomeKey].bookmakers[bookmaker.key] = {
            price: outcome.price,
            bookmakerTitle: bookmaker.title
          };
          
          // Also add to bookmaker's outcomes
          groupedProps[category][marketName].bookmakers[bookmaker.key].outcomes[outcomeKey] = outcome.price;
        });
      });
    });
    
    // Convert to array format for easier consumption
    const result = Object.entries(groupedProps).map(([category, markets]) => ({
      category,
      markets: Object.entries(markets).map(([marketName, marketData]) => ({
        name: marketName,
        key: marketData.marketKey,
        outcomes: Object.values(marketData.outcomes).map(outcome => ({
          name: outcome.name,
          point: outcome.point,
          oddsByBookmaker: Object.entries(outcome.bookmakers).map(([bookmakerKey, bookmakerData]) => ({
            bookmakerKey,
            bookmakerTitle: bookmakerData.bookmakerTitle,
            price: bookmakerData.price
          }))
        })),
        bookmakers: Object.values(marketData.bookmakers).map(bookmaker => ({
          title: bookmaker.title,
          outcomes: bookmaker.outcomes
        }))
      }))
    }));
    
    return NextResponse.json({ groupedProps: result });
    
  } catch (error) {
    console.error("Error fetching prop bets:", error);
    return NextResponse.json({ error: "Failed to fetch prop bets" }, { status: 500 });
  }
}