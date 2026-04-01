// Sport grouping: allows related sports to be shown together (e.g., all basketball leagues under one "Basketball" filter)
export const SPORT_GROUPS = {
  basketball: {
    id: "basketball",
    name: "Basketball",
    icon: "🏀",
    sports: ["basketball_nba", "basketball_ncaab"],
  },
  hockey: {
    id: "hockey",
    name: "Hockey",
    icon: "🏒",
    sports: ["icehockey_nhl"],
  },
  fighting: {
    id: "fighting",
    name: "Fighting",
    icon: "🥊",
    sports: ["mma_mixed_martial_arts", "boxing_boxing"],
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
};

export const TOP_SPORTS = [
  { id: "americanfootball_nfl", name: "NFL", icon: "🏈", espnPaths: ["football/nfl"], oddsKeys: ["americanfootball_nfl"] },
  { id: "americanfootball_ncaaf", name: "NCAAF", icon: "🏈", espnPaths: ["football/college-football"], oddsKeys: ["americanfootball_ncaaf"] },
  { id: "basketball", name: "Basketball", icon: "🏀", isGroup: true, group: "basketball" },
  { id: "baseball_mlb", name: "MLB", icon: "⚾", espnPaths: ["baseball/mlb"], oddsKeys: ["baseball_mlb"] },
  { id: "hockey", name: "Hockey", icon: "🏒", isGroup: true, group: "hockey" },
  { id: "fighting", name: "Fighting", icon: "🥊", isGroup: true, group: "fighting" },
];

export const EXTRA_SPORTS = [
  // Soccer
  { id: "soccer_epl", name: "Premier League", icon: "⚽", espnPaths: ["soccer/eng.1"], oddsKeys: ["soccer_epl"] },
  { id: "soccer_usa_mls", name: "MLS", icon: "⚽", espnPaths: ["soccer/usa.1"], oddsKeys: ["soccer_usa_mls"] },
  { id: "soccer_germany_bundesliga", name: "Bundesliga", icon: "⚽", espnPaths: ["soccer/ger.1"], oddsKeys: ["soccer_germany_bundesliga"] },
  { id: "soccer_spain_la_liga", name: "La Liga", icon: "⚽", espnPaths: ["soccer/esp.1"], oddsKeys: ["soccer_spain_la_liga"] },
  { id: "soccer_italy_serie_a", name: "Serie A", icon: "⚽", espnPaths: ["soccer/ita.1"], oddsKeys: ["soccer_italy_serie_a"] },
  { id: "soccer_france_ligue_one", name: "Ligue 1", icon: "⚽", espnPaths: ["soccer/fra.1"], oddsKeys: ["soccer_france_ligue_one"] },
  { id: "soccer_uefa_champs_league", name: "Champions League", icon: "⚽", espnPaths: ["soccer/uefa.champions"], oddsKeys: ["soccer_uefa_champs_league"] },
  { id: "soccer_conmebol_copa_libertadores", name: "Copa Libertadores", icon: "⚽", espnPaths: ["soccer/conmebol.libertadores"], oddsKeys: ["soccer_conmebol_copa_libertadores"] },
  // World Cup 2026: show from March 2026 onward so fans can see the bracket/schedule (odds will say "Coming Soon" until books open)
  { id: "soccer_fifa_world_cup", name: "World Cup", icon: "🌍", espnPaths: ["soccer/fifa.world"], oddsKeys: ["soccer_fifa_world_cup"], visibilityWindow: { start: "2026-03-01", end: "2026-07-19" } },
  // Golf (outright/futures only — home_team/away_team are null in API response)
  { id: "golf_masters_tournament_winner", name: "Masters", icon: "⛳", espnPaths: [], oddsKeys: ["golf_masters_tournament_winner"], isOutright: true },
  { id: "golf_pga_championship_winner", name: "PGA Championship", icon: "⛳", espnPaths: [], oddsKeys: ["golf_pga_championship_winner"], isOutright: true },
  { id: "golf_us_open_winner", name: "US Open (Golf)", icon: "⛳", espnPaths: [], oddsKeys: ["golf_us_open_winner"], isOutright: true },
  { id: "golf_the_open_championship_winner", name: "The Open", icon: "⛳", espnPaths: [], oddsKeys: ["golf_the_open_championship_winner"], isOutright: true },
  // Tennis
  { id: "tennis_atp_miami_open", name: "ATP Miami Open", icon: "🎾", espnPaths: [], oddsKeys: ["tennis_atp_miami_open"] },
  { id: "tennis_wta_miami_open", name: "WTA Miami Open", icon: "🎾", espnPaths: [], oddsKeys: ["tennis_wta_miami_open"] },
  // Boxing / Combat
  { id: "boxing_boxing", name: "Boxing", icon: "🥊", espnPaths: [], oddsKeys: ["boxing_boxing"] },
  // Rugby
  { id: "rugbyleague_nrl", name: "NRL", icon: "🏉", espnPaths: [], oddsKeys: ["rugbyleague_nrl"] },
  // Cricket
  { id: "cricket_ipl", name: "IPL Cricket", icon: "🏏", espnPaths: [], oddsKeys: ["cricket_ipl"] },
  // Aussie Rules
  { id: "aussierules_afl", name: "AFL", icon: "🏈", espnPaths: [], oddsKeys: ["aussierules_afl"] },
  // Olympics removed — 2024 Paris Olympics are over; re-add for 2028 LA Olympics when the time comes
];

export const ALL_CATEGORIES = [...TOP_SPORTS, ...EXTRA_SPORTS];
export const TOP_IDS = TOP_SPORTS.map((sport) => sport.id);
