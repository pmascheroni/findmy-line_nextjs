export const TOP_SPORTS = [
  { id: "americanfootball_nfl", name: "NFL", icon: "🏈", espnPaths: ["football/nfl"], oddsKeys: ["americanfootball_nfl"] },
  { id: "americanfootball_ncaaf", name: "NCAAF", icon: "🏈", espnPaths: ["football/college-football"], oddsKeys: ["americanfootball_ncaaf"] },
  { id: "basketball_nba", name: "NBA", icon: "🏀", espnPaths: ["basketball/nba"], oddsKeys: ["basketball_nba"] },
  { id: "basketball_ncaab", name: "NCAAB", icon: "🏀", espnPaths: ["basketball/mens-college-basketball"], oddsKeys: ["basketball_ncaab"] },
  { id: "baseball_mlb", name: "MLB", icon: "⚾", espnPaths: ["baseball/mlb"], oddsKeys: ["baseball_mlb"] },
  { id: "icehockey_nhl", name: "NHL", icon: "🏒", espnPaths: ["hockey/nhl"], oddsKeys: ["icehockey_nhl"] },
  { id: "mma_mixed_martial_arts", name: "UFC", icon: "🥊", espnPaths: ["mma/ufc"], oddsKeys: ["mma_mixed_martial_arts"] },
];

export const EXTRA_SPORTS = [
  { id: "tennis", name: "Tennis", icon: "🎾", espnPaths: ["tennis/atp", "tennis/wta"], oddsGroup: "Tennis" },
  { id: "olympics", name: "Olympics", icon: "🥇", espnPaths: ["olympics"], oddsGroup: "Olympics" },
  { id: "soccer_epl", name: "EPL", icon: "⚽", espnPaths: ["soccer/eng.1"], oddsKeys: ["soccer_epl"] },
  { id: "soccer_usa_mls", name: "MLS", icon: "⚽", espnPaths: ["soccer/usa.1"], oddsKeys: ["soccer_usa_mls"] },
];

export const ALL_CATEGORIES = [...TOP_SPORTS, ...EXTRA_SPORTS];
export const TOP_IDS = TOP_SPORTS.map((sport) => sport.id);
