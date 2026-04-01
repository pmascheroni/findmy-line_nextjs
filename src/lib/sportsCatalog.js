// Sport grouping: allows related sports to be shown together (e.g., all basketball leagues under one "Basketball" filter)
// This also serves as the "parent" category for Tier 1 filters
export const SPORT_GROUPS = {
  football: {
    id: "football",
    name: "Football",
    icon: "🏈",
    sports: ["americanfootball_nfl", "americanfootball_ncaaf"],
  },
  basketball: {
    id: "basketball",
    name: "Basketball",
    icon: "🏀",
    sports: ["basketball_nba", "basketball_ncaab"],
  },
  baseball: {
    id: "baseball",
    name: "Baseball",
    icon: "⚾",
    sports: ["baseball_mlb"],
  },
  hockey: {
    id: "hockey",
    name: "Hockey",
    icon: "🏒",
    sports: ["icehockey_nhl"],
  },
  soccer: {
    id: "soccer",
    name: "Soccer",
    icon: "⚽",
    sports: [
      "soccer_epl",
      "soccer_usa_mls",
      "soccer_germany_bundesliga",
      "soccer_spain_la_liga",
      "soccer_italy_serie_a",
      "soccer_france_ligue_one",
      "soccer_uefa_champs_league",
      "soccer_conmebol_copa_libertadores",
      "soccer_fifa_world_cup",
    ],
  },
  tennis: {
    id: "tennis",
    name: "Tennis",
    icon: "🎾",
    sports: ["tennis_atp_miami_open", "tennis_wta_miami_open"],
  },
  golf: {
    id: "golf",
    name: "Golf",
    icon: "⛳",
    sports: [
      "golf_masters_tournament_winner",
      "golf_pga_championship_winner",
      "golf_us_open_winner",
      "golf_the_open_championship_winner",
    ],
  },
  fighting: {
    id: "fighting",
    name: "Fighting",
    icon: "🥊",
    sports: ["mma_mixed_martial_arts", "boxing_boxing"],
  },
  rugby: {
    id: "rugby",
    name: "Rugby",
    icon: "🏉",
    sports: ["rugbyleague_nrl"],
  },
  cricket: {
    id: "cricket",
    name: "Cricket",
    icon: "🏏",
    sports: ["cricket_ipl"],
  },
  aussie_rules: {
    id: "aussie_rules",
    name: "Aussie Rules",
    icon: "🏈",
    sports: ["aussierules_afl"],
  },
};

// TOP_SPORTS: Primary sport categories shown in Tier 1 filter
export const TOP_SPORTS = [
  { id: "football", name: "Football", icon: "🏈", isGroup: true, group: "football" },
  { id: "basketball", name: "Basketball", icon: "🏀", isGroup: true, group: "basketball" },
  { id: "baseball", name: "Baseball", icon: "⚾", isGroup: true, group: "baseball" },
  { id: "hockey", name: "Hockey", icon: "🏒", isGroup: true, group: "hockey" },
  { id: "soccer", name: "Soccer", icon: "⚽", isGroup: true, group: "soccer" },
  { id: "tennis", name: "Tennis", icon: "🎾", isGroup: true, group: "tennis" },
  { id: "golf", name: "Golf", icon: "⛳", isGroup: true, group: "golf" },
  { id: "fighting", name: "Fighting", icon: "🥊", isGroup: true, group: "fighting" },
  { id: "rugby", name: "Rugby", icon: "🏉", isGroup: true, group: "rugby" },
  { id: "cricket", name: "Cricket", icon: "🏏", isGroup: true, group: "cricket" },
  { id: "aussie_rules", name: "Aussie Rules", icon: "🏈", isGroup: true, group: "aussie_rules" },
];

// EXTRA_SPORTS: Individual leagues/events, organized by sport group
export const EXTRA_SPORTS = [
  // Football
  { id: "americanfootball_nfl", name: "NFL", icon: "🏈", espnPaths: ["football/nfl"], oddsKeys: ["americanfootball_nfl"], parentGroup: "football" },
  { id: "americanfootball_ncaaf", name: "NCAAF", icon: "🏈", espnPaths: ["football/college-football"], oddsKeys: ["americanfootball_ncaaf"], parentGroup: "football" },

  // Basketball
  { id: "basketball_nba", name: "NBA", icon: "🏀", espnPaths: ["basketball/nba"], oddsKeys: ["basketball_nba"], parentGroup: "basketball" },
  { id: "basketball_ncaab", name: "College Basketball", icon: "🏀", espnPaths: ["basketball/college-basketball"], oddsKeys: ["basketball_ncaab"], parentGroup: "basketball" },

  // Baseball
  { id: "baseball_mlb", name: "MLB", icon: "⚾", espnPaths: ["baseball/mlb"], oddsKeys: ["baseball_mlb"], parentGroup: "baseball" },

  // Hockey
  { id: "icehockey_nhl", name: "NHL", icon: "🏒", espnPaths: ["hockey/nhl"], oddsKeys: ["icehockey_nhl"], parentGroup: "hockey" },

  // Soccer
  { id: "soccer_epl", name: "Premier League", icon: "⚽", espnPaths: ["soccer/eng.1"], oddsKeys: ["soccer_epl"], parentGroup: "soccer" },
  { id: "soccer_usa_mls", name: "MLS", icon: "⚽", espnPaths: ["soccer/usa.1"], oddsKeys: ["soccer_usa_mls"], parentGroup: "soccer" },
  { id: "soccer_germany_bundesliga", name: "Bundesliga", icon: "⚽", espnPaths: ["soccer/ger.1"], oddsKeys: ["soccer_germany_bundesliga"], parentGroup: "soccer" },
  { id: "soccer_spain_la_liga", name: "La Liga", icon: "⚽", espnPaths: ["soccer/esp.1"], oddsKeys: ["soccer_spain_la_liga"], parentGroup: "soccer" },
  { id: "soccer_italy_serie_a", name: "Serie A", icon: "⚽", espnPaths: ["soccer/ita.1"], oddsKeys: ["soccer_italy_serie_a"], parentGroup: "soccer" },
  { id: "soccer_france_ligue_one", name: "Ligue 1", icon: "⚽", espnPaths: ["soccer/fra.1"], oddsKeys: ["soccer_france_ligue_one"], parentGroup: "soccer" },
  { id: "soccer_uefa_champs_league", name: "Champions League", icon: "⚽", espnPaths: ["soccer/uefa.champions"], oddsKeys: ["soccer_uefa_champs_league"], parentGroup: "soccer" },
  { id: "soccer_conmebol_copa_libertadores", name: "Copa Libertadores", icon: "⚽", espnPaths: ["soccer/conmebol.libertadores"], oddsKeys: ["soccer_conmebol_copa_libertadores"], parentGroup: "soccer" },
  { id: "soccer_fifa_world_cup", name: "World Cup", icon: "🌍", espnPaths: ["soccer/fifa.world"], oddsKeys: ["soccer_fifa_world_cup"], parentGroup: "soccer", visibilityWindow: { start: "2026-03-01", end: "2026-07-19" } },

  // Tennis
  { id: "tennis_atp_miami_open", name: "ATP Miami Open", icon: "🎾", espnPaths: [], oddsKeys: ["tennis_atp_miami_open"], parentGroup: "tennis" },
  { id: "tennis_wta_miami_open", name: "WTA Miami Open", icon: "🎾", espnPaths: [], oddsKeys: ["tennis_wta_miami_open"], parentGroup: "tennis" },

  // Golf
  { id: "golf_masters_tournament_winner", name: "Masters", icon: "⛳", espnPaths: [], oddsKeys: ["golf_masters_tournament_winner"], parentGroup: "golf", isOutright: true },
  { id: "golf_pga_championship_winner", name: "PGA Championship", icon: "⛳", espnPaths: [], oddsKeys: ["golf_pga_championship_winner"], parentGroup: "golf", isOutright: true },
  { id: "golf_us_open_winner", name: "US Open (Golf)", icon: "⛳", espnPaths: [], oddsKeys: ["golf_us_open_winner"], parentGroup: "golf", isOutright: true },
  { id: "golf_the_open_championship_winner", name: "The Open", icon: "⛳", espnPaths: [], oddsKeys: ["golf_the_open_championship_winner"], parentGroup: "golf", isOutright: true },

  // Fighting
  { id: "mma_mixed_martial_arts", name: "MMA/UFC", icon: "🥋", espnPaths: [], oddsKeys: ["mma_mixed_martial_arts"], parentGroup: "fighting" },
  { id: "boxing_boxing", name: "Boxing", icon: "🥊", espnPaths: [], oddsKeys: ["boxing_boxing"], parentGroup: "fighting" },

  // Rugby
  { id: "rugbyleague_nrl", name: "NRL", icon: "🏉", espnPaths: [], oddsKeys: ["rugbyleague_nrl"], parentGroup: "rugby" },

  // Cricket
  { id: "cricket_ipl", name: "IPL Cricket", icon: "🏏", espnPaths: [], oddsKeys: ["cricket_ipl"], parentGroup: "cricket" },

  // Aussie Rules
  { id: "aussierules_afl", name: "AFL", icon: "🏈", espnPaths: [], oddsKeys: ["aussierules_afl"], parentGroup: "aussie_rules" },
];

export const ALL_CATEGORIES = [...TOP_SPORTS, ...EXTRA_SPORTS];
export const TOP_IDS = TOP_SPORTS.map((sport) => sport.id);

/**
 * Get all leagues for a given sport group.
 * Returns EXTRA_SPORTS entries that belong to the group.
 */
export function getLeaguesForSportGroup(groupId) {
  return EXTRA_SPORTS.filter((sport) => sport.parentGroup === groupId);
}

/**
 * Get a sport entry by ID (from TOP_SPORTS or EXTRA_SPORTS)
 */
export function getSportById(id) {
  return TOP_SPORTS.find((s) => s.id === id) || EXTRA_SPORTS.find((s) => s.id === id);
}

/**
 * Determine if a league has games on a given date.
 * This is calculated from the summary counts passed in.
 */
export function hasGamesOnDate(leagueId, summary = {}) {
  return (summary[leagueId] || 0) > 0;
}

/**
 * Get "coming this week" status for a league.
 * Given summaries for multiple dates, determine if league has games.
 * Returns: 'today' | 'upcoming' | 'none'
 */
export function getLeagueStatus(leagueId, todaySummary = {}, upcomingDaySummaries = []) {
  const hasGameToday = (todaySummary[leagueId] || 0) > 0;
  if (hasGameToday) return 'today';
  
  const hasGameThisWeek = upcomingDaySummaries.some((summary) => (summary[leagueId] || 0) > 0);
  if (hasGameThisWeek) return 'upcoming';
  
  return 'none';
}

/**
 * Get indicator dot color for a sport based on game availability
 */
export function getSportIndicatorColor(groupId, summary = {}) {
  const leagues = getLeaguesForSportGroup(groupId);
  const hasGameToday = leagues.some((league) => (summary[league.id] || 0) > 0);
  if (hasGameToday) return 'green'; // 🟢 Games today
  
  // TODO: Check upcoming dates for yellow indicator
  // For now, we'll implement the basic today/none logic
  return 'none';
}
