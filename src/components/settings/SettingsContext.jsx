import { createContext, useContext, useState, useEffect } from "react";

// Prediction Markets - ordered with Polymarket and Kalshi first
export const ALL_PREDICTION_MARKETS = [
  { key: "polymarket", name: "Polymarket", short: "POLY", region: "Prediction Market" },
  { key: "kalshi", name: "Kalshi", short: "KAL", region: "Prediction Market" },
  { key: "betopenly", name: "BetOpenly", short: "BO", region: "Prediction Market" },
  { key: "novig", name: "Novig", short: "NV", region: "Prediction Market" },
  { key: "prophetx", name: "ProphetX", short: "PX", region: "Prediction Market" },
];

export const ALL_SPORTSBOOKS = [
  // US Bookmakers
  { key: "betonlineag", name: "BetOnline.ag", short: "BOL", region: "US" },
  { key: "betmgm", name: "BetMGM", short: "MGM", region: "US" },
  { key: "betrivers", name: "BetRivers", short: "BR", region: "US" },
  { key: "betus", name: "BetUS", short: "BUS", region: "US" },
  { key: "bovada", name: "Bovada", short: "BOV", region: "US" },
  { key: "williamhill_us", name: "Caesars", short: "CZR", region: "US" },
  { key: "draftkings", name: "DraftKings", short: "DK", region: "US" },
  { key: "fanatics", name: "Fanatics", short: "FAN", region: "US" },
  { key: "fanduel", name: "FanDuel", short: "FD", region: "US" },
  { key: "lowvig", name: "LowVig.ag", short: "LV", region: "US" },
  { key: "mybookieag", name: "MyBookie.ag", short: "MB", region: "US" },
  { key: "ballybet", name: "Bally Bet", short: "BALLY", region: "US" },
  { key: "betanysports", name: "BetAnything", short: "BAS", region: "US" },
  { key: "betparx", name: "betPARX", short: "PRX", region: "US" },
  { key: "espnbet", name: "ESPN Bet", short: "ESPN", region: "US" },
  { key: "fliff", name: "Fliff", short: "FLF", region: "US" },
  { key: "hardrockbet", name: "Hard Rock Bet", short: "HR", region: "US" },
  { key: "rebet", name: "ReBet", short: "RB", region: "US" },
  // US DFS
  { key: "betr_us_dfs", name: "Betr Picks", short: "BETR", region: "US DFS" },
  { key: "pick6", name: "DraftKings Pick6", short: "PK6", region: "US DFS" },
  { key: "prizepicks", name: "PrizePicks", short: "PP", region: "US DFS" },
  { key: "underdog", name: "Underdog Fantasy", short: "UD", region: "US DFS" },
  // UK Bookmakers
  { key: "sport888", name: "888sport", short: "888", region: "UK" },
  { key: "betfair_ex_uk", name: "Betfair Exchange", short: "BFX", region: "UK" },
  { key: "betfair_sb_uk", name: "Betfair Sportsbook", short: "BF", region: "UK" },
  { key: "betvictor", name: "Bet Victor", short: "BV", region: "UK" },
  { key: "betway", name: "Betway", short: "BW", region: "UK" },
  { key: "boylesports", name: "BoyleSports", short: "BYL", region: "UK" },
  { key: "casumo", name: "Casumo", short: "CAS", region: "UK" },
  { key: "coral", name: "Coral", short: "COR", region: "UK" },
  { key: "grosvenor", name: "Grosvenor", short: "GRO", region: "UK" },
  { key: "ladbrokes_uk", name: "Ladbrokes", short: "LAD", region: "UK" },
  { key: "leovegas", name: "LeoVegas", short: "LEO", region: "UK" },
  { key: "livescorebet", name: "LiveScore Bet", short: "LSB", region: "UK" },
  { key: "matchbook", name: "Matchbook", short: "MBK", region: "UK" },
  { key: "paddypower", name: "Paddy Power", short: "PP", region: "UK" },
  { key: "skybet", name: "Sky Bet", short: "SKY", region: "UK" },
  { key: "smarkets", name: "Smarkets", short: "SMK", region: "UK" },
  { key: "unibet_uk", name: "Unibet (UK)", short: "UNI", region: "UK" },
  { key: "virginbet", name: "Virgin Bet", short: "VB", region: "UK" },
  { key: "williamhill", name: "William Hill (UK)", short: "WH", region: "UK" },
  // EU Bookmakers
  { key: "onexbet", name: "1xBet", short: "1XB", region: "EU" },
  { key: "betclic_fr", name: "Betclic (FR)", short: "BCL", region: "EU" },
  { key: "betfair_ex_eu", name: "Betfair Exchange (EU)", short: "BFE", region: "EU" },
  { key: "betsson", name: "Betsson", short: "BSN", region: "EU" },
  { key: "codere_it", name: "Codere (IT)", short: "COD", region: "EU" },
  { key: "coolbet", name: "Coolbet", short: "CB", region: "EU" },
  { key: "everygame", name: "Everygame", short: "EG", region: "EU" },
  { key: "gtbets", name: "GTbets", short: "GT", region: "EU" },
  { key: "leovegas_se", name: "LeoVegas (SE)", short: "LVS", region: "EU" },
  { key: "marathonbet", name: "Marathon Bet", short: "MAR", region: "EU" },
  { key: "nordicbet", name: "NordicBet", short: "NOR", region: "EU" },
  { key: "parionssport_fr", name: "Parions Sport (FR)", short: "PSF", region: "EU" },
  { key: "pinnacle", name: "Pinnacle", short: "PIN", region: "EU" },
  { key: "pmu_fr", name: "PMU (FR)", short: "PMU", region: "EU" },
  { key: "suprabets", name: "Suprabets", short: "SUP", region: "EU" },
  { key: "tipico_de", name: "Tipico (DE)", short: "TIP", region: "EU" },
  { key: "unibet_fr", name: "Unibet (FR)", short: "UFR", region: "EU" },
  { key: "unibet_it", name: "Unibet (IT)", short: "UIT", region: "EU" },
  { key: "unibet_nl", name: "Unibet (NL)", short: "UNL", region: "EU" },
  { key: "unibet_se", name: "Unibet (SE)", short: "USE", region: "EU" },
  { key: "winamax_de", name: "Winamax (DE)", short: "WMD", region: "EU" },
  { key: "winamax_fr", name: "Winamax (FR)", short: "WMF", region: "EU" },
  // AU Bookmakers
  { key: "betfair_ex_au", name: "Betfair Exchange (AU)", short: "BFA", region: "AU" },
  { key: "betr_au", name: "Betr (AU)", short: "BTR", region: "AU" },
  { key: "bluebet", name: "BlueBet", short: "BB", region: "AU" },
  { key: "ladbrokes_au", name: "Ladbrokes (AU)", short: "LDA", region: "AU" },
  { key: "neds", name: "Neds", short: "NED", region: "AU" },
  { key: "playup", name: "PlayUp", short: "PU", region: "AU" },
  { key: "pointsbetau", name: "PointsBet (AU)", short: "PBA", region: "AU" },
  { key: "sportsbet", name: "Sportsbet", short: "SB", region: "AU" },
  { key: "tab", name: "TAB", short: "TAB", region: "AU" },
  { key: "topsport", name: "TopSport", short: "TS", region: "AU" },
  { key: "unibet_au", name: "Unibet (AU)", short: "UAU", region: "AU" },
];

const DEFAULT_SELECTED = ["draftkings", "fanduel", "betmgm", "williamhill_us", "espnbet"];
const DEFAULT_PREDICTION_MARKETS = ["polymarket", "kalshi"];

// View modes
export const VIEW_MODE_BOOKS = "books";
export const VIEW_MODE_MARKETS = "markets";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [selectedSportsbooks, setSelectedSportsbooks] = useState(() => {
    const saved =
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem("selectedSportsbooks")
        : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 5) {
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_SELECTED;
  });

  const [selectedPredictionMarkets, setSelectedPredictionMarkets] = useState(() => {
    const saved =
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem("selectedPredictionMarkets")
        : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 5) {
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_PREDICTION_MARKETS;
  });

  const [viewMode, setViewMode] = useState(() => {
    const saved =
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem("viewMode")
        : null;
    return saved === VIEW_MODE_MARKETS ? VIEW_MODE_MARKETS : VIEW_MODE_BOOKS;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.setItem === "function") {
      window.localStorage.setItem("selectedSportsbooks", JSON.stringify(selectedSportsbooks));
    }
  }, [selectedSportsbooks]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.setItem === "function") {
      window.localStorage.setItem("selectedPredictionMarkets", JSON.stringify(selectedPredictionMarkets));
    }
  }, [selectedPredictionMarkets]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.setItem === "function") {
      window.localStorage.setItem("viewMode", viewMode);
    }
  }, [viewMode]);

  const addSportsbook = (key) => {
    if (selectedSportsbooks.length >= 5) return false;
    if (selectedSportsbooks.includes(key)) return false;
    setSelectedSportsbooks(prev => [...prev, key]);
    return true;
  };

  const removeSportsbook = (key) => {
    if (selectedSportsbooks.length <= 1) return false;
    setSelectedSportsbooks(prev => prev.filter(k => k !== key));
    return true;
  };

  const replaceSportsbook = (oldKey, newKey) => {
    setSelectedSportsbooks(prev => prev.map(k => k === oldKey ? newKey : k));
  };

  const getSportsbooks = () => {
    return selectedSportsbooks.map(key => 
      ALL_SPORTSBOOKS.find(book => book.key === key)
    ).filter(Boolean);
  };

  // Prediction market functions
  const addPredictionMarket = (key) => {
    if (selectedPredictionMarkets.length >= 5) return false;
    if (selectedPredictionMarkets.includes(key)) return false;
    setSelectedPredictionMarkets(prev => [...prev, key]);
    return true;
  };

  const removePredictionMarket = (key) => {
    if (selectedPredictionMarkets.length <= 1) return false;
    setSelectedPredictionMarkets(prev => prev.filter(k => k !== key));
    return true;
  };

  const replacePredictionMarket = (oldKey, newKey) => {
    setSelectedPredictionMarkets(prev => prev.map(k => k === oldKey ? newKey : k));
  };

  const getPredictionMarkets = () => {
    return selectedPredictionMarkets.map(key => 
      ALL_PREDICTION_MARKETS.find(market => market.key === key)
    ).filter(Boolean);
  };

  return (
    <SettingsContext.Provider value={{
      allSportsbooks: ALL_SPORTSBOOKS,
      selectedSportsbooks,
      addSportsbook,
      removeSportsbook,
      replaceSportsbook,
      getSportsbooks,
      // Prediction markets
      allPredictionMarkets: ALL_PREDICTION_MARKETS,
      selectedPredictionMarkets,
      addPredictionMarket,
      removePredictionMarket,
      replacePredictionMarket,
      getPredictionMarkets,
      // View mode
      viewMode,
      setViewMode,
      isMarketsMode: viewMode === VIEW_MODE_MARKETS
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
