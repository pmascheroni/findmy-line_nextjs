"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ArrowLeft, Clock, Tv, TrendingUp, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import MarketSection from "@/components/game/MarketSection";
import LineHistoryChart from "@/components/game/LineHistoryChart";
import BetCalculator from "@/components/game/BetCalculator";
import InjuriesWidget from "@/components/game/InjuriesWidget";
import TrueOddsWidget from "@/components/game/TrueOddsWidget";
import GameStatsWidget from "@/components/game/GameStatsWidget";
import NewsWidget from "@/components/game/NewsWidget";
import PropBetsSection from "@/components/game/PropBetsSection";
import GameInfoBar from "@/components/game/GameInfoBar";
import { useTeamData } from "@/components/game/useTeamData";
import TeamLogo from "@/components/game/TeamLogo";
import { useSubscription } from "@/components/subscription/SubscriptionContext";
import UpgradeBanner from "@/components/subscription/UpgradeBanner";
import { useSettings } from "@/components/settings/SettingsContext";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/components/onboarding/useOnboarding";

const PROP_MARKETS_BY_SPORT = {
  americanfootball_nfl: [
    { key: "player_pass_yds", title: "Passing Yards", icon: "🏈" },
    { key: "player_pass_tds", title: "Passing TDs", icon: "🎯" },
    { key: "player_rush_yds", title: "Rushing Yards", icon: "💨" },
    { key: "player_reception_yds", title: "Receiving Yards", icon: "🙌" },
    { key: "player_receptions", title: "Receptions", icon: "👐" },
    { key: "player_anytime_td", title: "Anytime TD", icon: "🔥" },
  ],
  basketball_nba: [
    { key: "player_points", title: "Player Points", icon: "🏀" },
    { key: "player_rebounds", title: "Player Rebounds", icon: "💪" },
    { key: "player_assists", title: "Player Assists", icon: "🤝" },
    { key: "player_threes", title: "3PT Made", icon: "🎯" },
    { key: "player_points_rebounds_assists", title: "Player PRA", icon: "⭐" },
  ],
  baseball_mlb: [
    { key: "batter_home_runs", title: "Home Runs", icon: "⚾" },
    { key: "batter_hits", title: "Hits", icon: "🧤" },
    { key: "batter_rbis", title: "RBIs", icon: "🏆" },
    { key: "pitcher_strikeouts", title: "Pitcher Strikeouts", icon: "🎯" },
  ],
  icehockey_nhl: [
    { key: "player_goals", title: "Goals", icon: "🥅" },
    { key: "player_assists", title: "Assists", icon: "🤝" },
    { key: "player_points", title: "Points", icon: "⭐" },
    { key: "player_shots_on_goal", title: "Shots on Goal", icon: "🎯" },
  ],
};

const mergeBookmakers = (baseBookmakers = [], propBookmakers = []) => {
  const merged = [...baseBookmakers];
  propBookmakers.forEach((propBook) => {
    const existing = merged.find((book) => book.key === propBook.key);
    if (existing) {
      const existingMarkets = new Set(existing.markets?.map((market) => market.key));
      const newMarkets = (propBook.markets || []).filter((market) => !existingMarkets.has(market.key));
      if (newMarkets.length > 0) {
        existing.markets = [...(existing.markets || []), ...newMarkets];
      }
    } else {
      merged.push(propBook);
    }
  });
  return merged;
};

export default function GameDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params?.id;
  const sportKey = searchParams?.get("sport");

  const [game, setGame] = useState(null);
  const [initialGame, setInitialGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("markets");
  const [generatedOdds, setGeneratedOdds] = useState(null);
  const [teamRecords, setTeamRecords] = useState({});
  const [liveScore, setLiveScore] = useState(null);
  const [propsLoading, setPropsLoading] = useState(false);
  const [propsError, setPropsError] = useState(null);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const propsLoadedRef = useRef(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const { getTeam, teams } = useTeamData();
  const { isPaid } = useSubscription();
  const { isMarketsMode, selectedSportsbooks } = useSettings();
  const { completeTour, neverShowTour } = useOnboarding();
  const sportsbooksKey = selectedSportsbooks.join(",");
  
  const [selectedBet, setSelectedBet] = useState(null);
  
  // Check tour state ONCE on mount, not on every render
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const shouldShow = window.localStorage.getItem("findmyline_show_game_tour") === "true";
    if (shouldShow) {
      window.localStorage.removeItem("findmyline_show_game_tour");
    }
    return shouldShow;
  });

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Lazy-load line history when user switches to history tab
  useEffect(() => {
    if (activeTab !== "history" || historyLoaded || !game || !sportKey) return;
    const loadHistory = async () => {
      try {
        const params = new URLSearchParams();
        params.set("sport", sportKey);
        params.set("eventId", game.id);
        params.set("market", "h2h");
        params.set("bookmakers", selectedSportsbooks.join(","));
        const res = await fetch(`/api/odds/history?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (data.points?.length) {
          setHistoryPoints(data.points);
        }
      } catch {
        // fail silently — LineHistoryChart handles empty state gracefully
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, [activeTab, historyLoaded, game, sportKey, selectedSportsbooks]);

  const generateGameDetails = (existingGame) => {
    const BOOKMAKERS = ["draftkings", "fanduel", "betmgm", "williamhill_us", "espnbet"];
    const BOOK_TITLES = {
      draftkings: "DraftKings",
      fanduel: "FanDuel", 
      betmgm: "BetMGM",
      williamhill_us: "Caesars",
      espnbet: "ESPN BET"
    };

    const TEAMS = {
      americanfootball_nfl: ["Kansas City Chiefs", "Buffalo Bills", "Philadelphia Eagles", "Dallas Cowboys", "San Francisco 49ers", "Detroit Lions"],
      americanfootball_ncaaf: ["Alabama Crimson Tide", "Georgia Bulldogs", "Ohio State Buckeyes", "Michigan Wolverines"],
      basketball_nba: ["Boston Celtics", "Miami Heat", "Los Angeles Lakers", "Golden State Warriors", "Denver Nuggets"],
      basketball_ncaab: ["Duke Blue Devils", "North Carolina Tar Heels", "Kansas Jayhawks", "Kentucky Wildcats"],
      baseball_mlb: ["New York Yankees", "Boston Red Sox", "Los Angeles Dodgers", "San Francisco Giants"],
      icehockey_nhl: ["Edmonton Oilers", "Colorado Avalanche", "Toronto Maple Leafs", "Boston Bruins"],
    };

    const VENUES = {
      americanfootball_nfl: ["Arrowhead Stadium", "Highmark Stadium", "Lincoln Financial Field", "AT&T Stadium"],
      americanfootball_ncaaf: ["Bryant-Denny Stadium", "Sanford Stadium", "Ohio Stadium", "Michigan Stadium"],
      basketball_nba: ["TD Garden", "Kaseya Center", "Crypto.com Arena", "Chase Center"],
      basketball_ncaab: ["Cameron Indoor Stadium", "Dean Dome", "Allen Fieldhouse", "Rupp Arena"],
      baseball_mlb: ["Yankee Stadium", "Fenway Park", "Dodger Stadium", "Oracle Park"],
      icehockey_nhl: ["Rogers Place", "Ball Arena", "Scotiabank Arena", "TD Garden"],
    };

    const BROADCASTS = ["ESPN", "FOX", "CBS", "NBC", "TNT", "ABC", "ESPN2", "FS1"];

    const SPORT_TITLES = {
      americanfootball_nfl: "NFL",
      americanfootball_ncaaf: "NCAAF", 
      basketball_nba: "NBA",
      basketball_ncaab: "NCAAB",
      baseball_mlb: "MLB",
      icehockey_nhl: "NHL",
    };

    // Use seeded random for consistent odds generation
    const seed = gameId ? gameId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 12345;
    let randomSeed = seed;
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };

    const generatePrice = (base) => {
      const variance = Math.floor(seededRandom() * 15) - 7;
      return base + variance;
    };

    // If we have existing game data, use its teams
    const teams = TEAMS[sportKey] || TEAMS.basketball_nba;
    const homeTeam = existingGame?.home_team || teams[Math.floor(seededRandom() * teams.length)];
    const awayTeam = existingGame?.away_team || (() => {
      let away = teams[Math.floor(seededRandom() * teams.length)];
      while (away === homeTeam && teams.length > 1) {
        away = teams[Math.floor(seededRandom() * teams.length)];
      }
      return away;
    })();
    const venues = VENUES[sportKey] || VENUES.basketball_nba;

    const homeSpread = -3.5 - Math.floor(seededRandom() * 10) + Math.floor(seededRandom() * 5);
    const total = sportKey?.includes("football") ? 45 + Math.floor(seededRandom() * 15) :
                  sportKey?.includes("basketball") ? 220 + Math.floor(seededRandom() * 20) :
                  sportKey?.includes("baseball") ? 8.5 + Math.floor(seededRandom() * 3) :
                  6 + Math.floor(seededRandom() * 2);

    const homeFavorite = homeSpread < 0;
    const homeML = homeFavorite ? -150 - Math.floor(seededRandom() * 100) : 120 + Math.floor(seededRandom() * 100);
    const awayML = homeFavorite ? 130 + Math.floor(seededRandom() * 100) : -140 - Math.floor(seededRandom() * 80);

    const bookmakers = BOOKMAKERS.map(bookKey => ({
      key: bookKey,
      title: BOOK_TITLES[bookKey],
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: awayTeam, price: generatePrice(awayML) },
            { name: homeTeam, price: generatePrice(homeML) }
          ]
        },
        {
          key: "spreads",
          outcomes: [
            { name: awayTeam, price: generatePrice(-110), point: -homeSpread },
            { name: homeTeam, price: generatePrice(-110), point: homeSpread }
          ]
        },
        {
          key: "totals",
          outcomes: [
            { name: "Over", price: generatePrice(-110), point: total },
            { name: "Under", price: generatePrice(-110), point: total }
          ]
        },
        {
          key: "alternate_spreads",
          outcomes: [
            { name: awayTeam, price: generatePrice(-130), point: -homeSpread - 3 },
            { name: homeTeam, price: generatePrice(110), point: homeSpread + 3 },
            { name: awayTeam, price: generatePrice(-150), point: -homeSpread - 7 },
            { name: homeTeam, price: generatePrice(130), point: homeSpread + 7 },
            { name: awayTeam, price: generatePrice(110), point: -homeSpread + 3 },
            { name: homeTeam, price: generatePrice(-130), point: homeSpread - 3 },
          ]
        },
        {
          key: "alternate_totals",
          outcomes: [
            { name: "Over", price: generatePrice(-130), point: total + 3 },
            { name: "Under", price: generatePrice(110), point: total + 3 },
            { name: "Over", price: generatePrice(110), point: total - 3 },
            { name: "Under", price: generatePrice(-130), point: total - 3 },
            { name: "Over", price: generatePrice(-150), point: total + 6 },
            { name: "Under", price: generatePrice(130), point: total + 6 },
          ]
        },
        {
          key: "team_totals_home",
          outcomes: [
            { name: "Over", price: generatePrice(-110), point: Math.round(total / 2 + 1.5) },
            { name: "Under", price: generatePrice(-110), point: Math.round(total / 2 + 1.5) }
          ]
        },
        {
          key: "team_totals_away",
          outcomes: [
            { name: "Over", price: generatePrice(-110), point: Math.round(total / 2 - 1.5) },
            { name: "Under", price: generatePrice(-110), point: Math.round(total / 2 - 1.5) }
          ]
        }
      ]
    }));

    return {
      id: gameId,
      sport_key: sportKey,
      sport_title: SPORT_TITLES[sportKey] || sportKey,
      commence_time: existingGame?.commence_time || new Date().toISOString(),
      home_team: homeTeam,
      away_team: awayTeam,
      venue: existingGame?.venue || venues[Math.floor(seededRandom() * venues.length)],
      broadcast: existingGame?.broadcast || BROADCASTS[Math.floor(seededRandom() * BROADCASTS.length)],
      bookmakers
    };
  };

  const convertDecimalToAmerican = (decimal) => {
    if (decimal >= 2.0) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  };

  const fetchGameDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const existingGame = initialGame;
      
      if (existingGame) {
        // If the game already has bookmaker odds, just convert and use them
        if (existingGame.bookmakers?.length) {
          const gameWithAmericanOdds = {
            ...existingGame,
            bookmakers: existingGame.bookmakers.map(book => ({
              ...book,
              markets: book.markets?.map(market => ({
                ...market,
                outcomes: market.outcomes?.map(outcome => ({
                  name: outcome.name,
                  price: typeof outcome.price === 'number' && outcome.price < 100 && outcome.price > -100
                    ? convertDecimalToAmerican(outcome.price)
                    : outcome.price,
                  ...(outcome.point !== undefined && { point: outcome.point })
                }))
              }))
            }))
          };
          setGame(gameWithAmericanOdds);
          return gameWithAmericanOdds;
        }

        // No bookmakers (ESPN-only event) — try fetching live odds by team name match
        // This handles the case where odds just became available after the user navigated here
        if (sportKey && existingGame.home_team && existingGame.away_team) {
          try {
            const params = new URLSearchParams();
            params.set("sports", sportKey);
            params.set("date", existingGame.commence_time || new Date().toISOString());
            params.set("marketsMode", "0");
            params.set("sportsbooks", selectedSportsbooks.join(","));
            params.set("tzOffset", String(new Date().getTimezoneOffset()));
            const res = await fetch(`/api/odds?${params.toString()}`, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));
            const matched = matchGame(data?.games || [], existingGame);
            if (matched?.bookmakers?.length) {
              // Found live odds — upgrade the game with the real Odds API ID and odds
              const upgraded = { ...existingGame, ...matched };
              setGame(upgraded);
              return upgraded;
            }
          } catch {
            // Fall through to showing event without odds
          }
        }

        // No odds available — show event info without odds sections
        setGame(existingGame);
        return existingGame;
      } else {
        const gameData = generateGameDetails(null);
        setGame(gameData);
        return gameData;
      }
    } catch (err) {
      console.error("Error fetching game:", err);
      setError("Failed to load game details");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const matchGame = (games, baseGame) => {
    if (!baseGame || !Array.isArray(games)) return null;
    const direct = games.find((item) => item.id === baseGame.id);
    if (direct) return direct;
    const normalize = (name) =>
      String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const baseTeams = [normalize(baseGame.home_team), normalize(baseGame.away_team)].sort().join("|");
    const baseTime = new Date(baseGame.commence_time || 0).getTime();
    return games.find((item) => {
      const teams = [normalize(item.home_team), normalize(item.away_team)].sort().join("|");
      if (teams !== baseTeams) return false;
      const time = new Date(item.commence_time || 0).getTime();
      return Math.abs(time - baseTime) < 12 * 60 * 60 * 1000;
    });
  };

  const fetchPropMarkets = async ({ force = false, targetGame } = {}) => {
    const baseGame = targetGame || game;
    const propMarkets = PROP_MARKETS_BY_SPORT[sportKey] || [];
    if (!baseGame || !sportKey || propMarkets.length === 0) return;
    if (isMarketsMode) return;
    if (!force && propsLoadedRef.current) return;

    setPropsLoading(true);
    setPropsError(null);
    try {
      // Use the dedicated event-specific props endpoint for better accuracy
      const params = new URLSearchParams();
      params.set("sportKey", sportKey);
      params.set("all", "1");
      params.set("date", baseGame.commence_time || new Date().toISOString());
      params.set("tzOffset", String(new Date().getTimezoneOffset()));

      const res = await fetch(`/api/odds/props/${baseGame.id}?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load props");
      }

      const groupedProps = data?.groupedProps || [];
      if (!groupedProps.length) {
        setPropsError("Prop bets not yet available for this game — check back closer to game time.");
        propsLoadedRef.current = true;
        return;
      }

      // Convert groupedProps format back to bookmakers format for MarketSection compatibility
      // Build a synthetic bookmakers array merged into the game
      const syntheticBookmakers = [];
      groupedProps.forEach((categoryGroup) => {
        categoryGroup.markets.forEach((market) => {
          market.bookmakers.forEach((bm) => {
            const existing = syntheticBookmakers.find((b) => b.title === bm.title);
            const marketEntry = {
              key: market.key,
              last_update: new Date().toISOString(),
              outcomes: Object.entries(bm.outcomes).map(([outcomeKey, price]) => {
                const [name, point] = outcomeKey.split("|");
                return { name, point: point ? parseFloat(point) : undefined, price };
              }),
            };
            if (existing) {
              existing.markets.push(marketEntry);
            } else {
              syntheticBookmakers.push({
                key: bm.title.toLowerCase().replace(/\s+/g, "_"),
                title: bm.title,
                markets: [marketEntry],
              });
            }
          });
        });
      });

      if (!syntheticBookmakers.length) {
        setPropsError("Prop bets not yet available for this game — check back closer to game time.");
        propsLoadedRef.current = true;
        return;
      }

      setGame((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bookmakers: mergeBookmakers(prev.bookmakers || [], syntheticBookmakers),
        };
      });
      propsLoadedRef.current = true;
    } catch (err) {
      setPropsError(err?.message || "Failed to load props");
    } finally {
      setPropsLoading(false);
    }
  };

  const handleReload = async () => {
    propsLoadedRef.current = false;
    setPropsError(null);
    const refreshed = await fetchGameDetails();
    if (refreshed) {
      await fetchPropMarkets({ force: true, targetGame: refreshed });
    }
  };

  useEffect(() => {
    if (!gameId) return;
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(`game_${gameId}`);
      if (cached) {
        try {
          setInitialGame(JSON.parse(cached));
        } catch {
          setInitialGame(null);
        }
      }
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId && sportKey) {
      fetchGameDetails();
    }
  }, [gameId, sportKey, isMarketsMode, initialGame]);

  useEffect(() => {
    if (!game || !sportKey) return;
    if (isMarketsMode) return;
    fetchPropMarkets({ targetGame: game });
  }, [game?.id, game?.commence_time, game?.home_team, game?.away_team, sportKey, isMarketsMode, sportsbooksKey]);

  // Fetch live scores AND team records from ESPN
  useEffect(() => {
    // Check if we have mock live data from test page
    const mockLiveData = typeof window !== "undefined" ? window.sessionStorage.getItem(`mock_live_${gameId}`) : null;
    if (mockLiveData) {
      setLiveScore(JSON.parse(mockLiveData));
      return; // Don't fetch from ESPN if we have mock data
    }
    
    const fetchESPNData = async () => {
      if (!game || !sportKey) return;
      
      const espnSportMap = {
        'americanfootball_nfl': 'football/nfl',
        'americanfootball_ncaaf': 'football/college-football',
        'basketball_nba': 'basketball/nba',
        'basketball_ncaab': 'basketball/mens-college-basketball',
        'baseball_mlb': 'baseball/mlb',
        'icehockey_nhl': 'hockey/nhl',
      };
      
      const espnPath = espnSportMap[sportKey];
      if (!espnPath) return;
      
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      const isPotentiallyLive = now > gameTime && (now - gameTime) < 6 * 60 * 60 * 1000;
      
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Better team name matching - normalize and check multiple ways
        const normalizeForMatch = (name) => {
          if (!name) return '';
          return name.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        };
        
        const getTeamWords = (name) => normalizeForMatch(name).split(' ').filter(w => w.length > 2);
        const homeWords = getTeamWords(game.home_team);
        const awayWords = getTeamWords(game.away_team);
        
        const teamsMatch = (espnName, gameWords) => {
          const espnWords = getTeamWords(espnName);
          // Check if any significant word matches (like "Demons", "Lumberjacks", "Austin", etc.)
          return gameWords.some(gw => espnWords.some(ew => ew.includes(gw) || gw.includes(ew)));
        };
        
        for (const event of data.events || []) {
          const competition = event.competitions?.[0];
          const competitors = competition?.competitors || [];
          
          let homeComp = null;
          let awayComp = null;
          
          for (const comp of competitors) {
            const espnFullName = comp.team?.displayName || comp.team?.name || '';
            const espnShort = comp.team?.shortDisplayName || '';
            
            if (teamsMatch(espnFullName, homeWords) || teamsMatch(espnShort, homeWords)) {
              homeComp = comp;
            }
            if (teamsMatch(espnFullName, awayWords) || teamsMatch(espnShort, awayWords)) {
              awayComp = comp;
            }
          }
          
          if (homeComp && awayComp) {
            // Always set team records
            setTeamRecords({
              [game.home_team]: { record: homeComp.records?.[0]?.summary || null },
              [game.away_team]: { record: awayComp.records?.[0]?.summary || null }
            });
            
            // Get venue from ESPN if available
            const espnVenue = competition?.venue;
            if (espnVenue && !game.venue) {
              const venueName = espnVenue.fullName || espnVenue.shortName;
              const venueLocation = espnVenue.address?.city && espnVenue.address?.state 
                ? `${espnVenue.address.city}, ${espnVenue.address.state}`
                : espnVenue.address?.city || '';
              if (venueName) {
                setGame(prev => ({
                  ...prev,
                  venue: venueName,
                  venueLocation: venueLocation,
                  isIndoor: espnVenue.indoor
                }));
              }
            }

            // Only set live score data if game is in progress or completed
            const gameState = competition?.status?.type?.state;
            if (isPotentiallyLive && (gameState === 'in' || gameState === 'post')) {
              // Get period scores (linescores)
              const homeLinescores = homeComp.linescores?.map(ls => ls.value) || [];
              const awayLinescores = awayComp.linescores?.map(ls => ls.value) || [];

              setLiveScore({
                home: homeComp.score || '0',
                away: awayComp.score || '0',
                homeAbbr: homeComp.team?.abbreviation || '',
                awayAbbr: awayComp.team?.abbreviation || '',
                homeLinescores,
                awayLinescores,
                status: competition?.status?.type?.description || 'In Progress',
                shortStatus: competition?.status?.type?.shortDetail || '',
                period: competition?.status?.period,
                clock: competition?.status?.displayClock,
                isComplete: competition?.status?.type?.completed || false,
                isLive: gameState === 'in',
                broadcast: competition?.broadcasts?.[0]?.names?.[0] || '',
                // Additional live details
                possession: competition?.situation?.possession,
                homeTimeouts: competition?.situation?.homeTimeouts,
                awayTimeouts: competition?.situation?.awayTimeouts,
                lastPlay: competition?.situation?.lastPlay?.text
              });
            }
            break;
          }
          }
          } catch (err) {
          console.error("Error fetching ESPN data:", err);
          }
          };

          fetchESPNData();

          // Refresh every 30 seconds if game might be live
          const gameTime = new Date(game?.commence_time);
          const now = new Date();
          const shouldPoll = now > gameTime && (now - gameTime) < 6 * 60 * 60 * 1000;

          if (shouldPoll) {
          const interval = setInterval(fetchESPNData, 30000);
          return () => clearInterval(interval);
          }
          }, [game, sportKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading game details...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-red-400 mb-4">{error || "Game not found"}</p>
        <Link href={createPageUrl("Home")}>
          <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>
    );
  }

  const gameTime = new Date(game.commence_time);
  const isLive = hasHydrated ? new Date() > gameTime && !game.completed : false;
  const timeLabel = hasHydrated ? format(gameTime, "EEEE, MMMM d · h:mm a") : "Scheduled";

  const awayTeam = getTeam(game.away_team, game.sport_key);
  const homeTeam = getTeam(game.home_team, game.sport_key);

  return (
    <div className="space-y-6">
        {/* Onboarding Tour for Game Detail page */}
        {showTour && (
          <OnboardingTour 
            page="gameDetail" 
            onComplete={() => {
              setShowTour(false);
              completeTour("gameDetail");
            }} 
            onNeverShow={() => {
              setShowTour(false);
              neverShowTour();
            }}
          />
        )}

        {/* Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={createPageUrl("Home")}>
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReload}
          className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading || propsLoading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {/* Game Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-800/50 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

        <div className="relative p-6 sm:p-8">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {awayTeam?.conference && (
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  {awayTeam.conference}
                </span>
              )}
            </div>
            {isLive ? (
              <span className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                {timeLabel}
              </span>
            )}
          </div>

          {/* Teams */}
          {liveScore ? (
            /* Live Scoreboard Layout */
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {/* Away Team */}
              <div className="flex items-center gap-3 sm:gap-4">
                <TeamLogo team={awayTeam} sportKey={game.sport_key} size="lg" />
                <div className="text-left">
                  <h2 className="text-base sm:text-lg font-bold text-white">{game.away_team}</h2>
                  <p className="text-xs text-slate-500">
                            {teamRecords[game.away_team]?.record || ""}
                          </p>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white ml-2">{liveScore.away}</div>
              </div>

              {/* Center - Period Scores */}
              <div className="flex flex-col items-center">
                <div className={`text-sm font-semibold mb-2 ${liveScore.isLive ? 'text-red-400' : 'text-slate-400'}`}>
                  {liveScore.isLive && <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />}
                  {liveScore.clock && !liveScore.isComplete ? `${liveScore.clock} - ` : ''}{liveScore.shortStatus || liveScore.status}
                </div>

                {/* Period-by-period scores */}
                {liveScore.homeLinescores?.length > 0 && (
                  <div className="bg-slate-800/80 rounded-lg p-2 text-xs">
                    <table className="text-center">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="px-2"></th>
                          {liveScore.homeLinescores.map((_, i) => (
                            <th key={i} className="px-1.5 sm:px-2 font-medium">{i + 1}</th>
                          ))}
                          <th className="px-2 font-medium">T</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-slate-300">
                          <td className="px-2 text-left font-semibold">
                            {liveScore.possession === game.away_team && liveScore.isLive && (
                              <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1" title="Has possession" />
                            )}
                            {liveScore.awayAbbr}
                          </td>
                          {liveScore.awayLinescores.map((score, i) => (
                            <td key={i} className="px-1.5 sm:px-2">{score}</td>
                          ))}
                          <td className="px-2 font-bold text-white">{liveScore.away}</td>
                        </tr>
                        <tr className="text-slate-300">
                          <td className="px-2 text-left font-semibold">
                            {liveScore.possession === game.home_team && liveScore.isLive && (
                              <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1" title="Has possession" />
                            )}
                            {liveScore.homeAbbr}
                          </td>
                          {liveScore.homeLinescores.map((score, i) => (
                            <td key={i} className="px-1.5 sm:px-2">{score}</td>
                          ))}
                          <td className="px-2 font-bold text-white">{liveScore.home}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Timeouts remaining */}
                {liveScore.isLive && (liveScore.awayTimeouts !== undefined || liveScore.homeTimeouts !== undefined) && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>TO: {liveScore.awayAbbr} {liveScore.awayTimeouts ?? '-'}</span>
                    <span>TO: {liveScore.homeAbbr} {liveScore.homeTimeouts ?? '-'}</span>
                  </div>
                )}

                {liveScore.broadcast && (
                  <div className="text-xs text-slate-500 mt-2">{liveScore.broadcast}</div>
                )}
              </div>

              {/* Home Team */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-white mr-2">{liveScore.home}</div>
                <div className="text-right">
                  <h2 className="text-base sm:text-lg font-bold text-white">{game.home_team}</h2>
                  <p className="text-xs text-slate-500">
                            {teamRecords[game.home_team]?.record || ""}
                          </p>
                </div>
                <TeamLogo team={homeTeam} sportKey={game.sport_key} size="lg" />
              </div>
            </div>
          ) : (
            /* Pre-game Layout */
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="mx-auto mb-3">
                  <TeamLogo team={awayTeam} sportKey={game.sport_key} size="xl" className="mx-auto" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{game.away_team}</h2>
                        <p className="text-sm text-slate-500">
                          {teamRecords[game.away_team]?.record || ""}
                        </p>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-600">VS</div>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-3">
                  <TeamLogo team={homeTeam} sportKey={game.sport_key} size="xl" className="mx-auto" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{game.home_team}</h2>
                        <p className="text-sm text-slate-500">
                          {teamRecords[game.home_team]?.record || ""}
                        </p>
              </div>
            </div>
          )}

          {/* Game Info Bar */}
          <GameInfoBar 
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            gameDate={game.commence_time} 
            venue={game.venue}
            allTeams={teams}
            sportKey={game.sport_key}
            onTeamRecords={setTeamRecords}
          />
          
          {/* Broadcast */}
          {game.broadcast && (
            <div className="flex justify-center mt-3">
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Tv className="w-4 h-4" />
                {game.broadcast}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upgrade Banner for free users */}
      {!isPaid && <UpgradeBanner />}

      {/* Injuries Widget */}
      <InjuriesWidget 
        homeTeam={homeTeam || game.home_team}
        awayTeam={awayTeam || game.away_team}
        sportKey={game.sport_key}
      />

      {/* Season Stats Widget */}
      <GameStatsWidget
        homeTeam={homeTeam || game.home_team}
        awayTeam={awayTeam || game.away_team}
        sportKey={game.sport_key}
        commenceTime={game.commence_time}
      />

      {/* News Widget */}
      <NewsWidget homeTeam={homeTeam || game.home_team} awayTeam={awayTeam || game.away_team} sportKey={game.sport_key} />

      {/* True Odds Calculator */}
      <TrueOddsWidget game={game} />
      

      {/* True Odds Calculator */}
      <TrueOddsWidget game={game} />

      {/* Bet Calculator */}
      <div data-tour="bet-calculator">
        <BetCalculator />
      </div>

      {/* No odds banner for ESPN-only events */}
      {game && (!game.bookmakers || game.bookmakers.length === 0) && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-5 py-4 text-center">
          <p className="text-sm font-medium text-slate-300">Odds Coming Soon</p>
          <p className="text-xs text-slate-500 mt-1">
            Sportsbooks haven&apos;t posted lines for this game yet. Check back closer to game time.
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1">
          <TabsTrigger
            value="markets"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            All Markets
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Line History
          </TabsTrigger>
        </TabsList>

        {/* Markets Tab */}
        <TabsContent value="markets" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div data-tour="market-section">
              <MarketSection
                title="Moneyline"
                marketKey="h2h"
                game={game}
                icon="💰"
              />
            </div>
            <MarketSection
              title="Spread"
              marketKey="spreads"
              game={game}
              icon="📊"
            />
            <MarketSection
              title="Total (Over/Under)"
              marketKey="totals"
              game={game}
              icon="🎯"
            />
            <MarketSection
              title="Alternate Spreads"
              marketKey="alternate_spreads"
              game={game}
              icon="📈"
            />
            <MarketSection
              title="Alternate Totals"
              marketKey="alternate_totals"
              game={game}
              icon="📉"
            />
            <MarketSection
              title={`${game.home_team} Team Total`}
              marketKey="team_totals_home"
              game={game}
              icon="🏠"
            />
            <MarketSection
              title={`${game.away_team} Team Total`}
              marketKey="team_totals_away"
              game={game}
              icon="✈️"
            />
            {!isMarketsMode && (PROP_MARKETS_BY_SPORT[sportKey] || []).length > 0 && (
              <div className="pt-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Player Props</h3>
                    <p className="text-sm text-slate-500">
                      Live props pulled from the odds providers for this matchup.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPropMarkets({ force: true })}
                    className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${propsLoading ? "animate-spin" : ""}`} />
                    Refresh Props
                  </Button>
                </div>
                {propsError && (
                  <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    {propsError}
                  </div>
                )}
                {propsLoading && (
                  <div className="text-sm text-slate-400">Loading prop markets…</div>
                )}
                {(PROP_MARKETS_BY_SPORT[sportKey] || []).map((market) => (
                  <MarketSection
                    key={market.key}
                    title={market.title}
                    marketKey={market.key}
                    game={game}
                    icon={market.icon}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Line History Tab */}
        <TabsContent value="history">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Line Movement History
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Track how odds have shifted over time
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGameDetails}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div data-tour="line-history">
              <LineHistoryChart game={game} historicalData={historyPoints} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Live Gamecast for live games */}
      {liveScore?.isLive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-red-500/30 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800/50 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Live Gamecast</h3>
          </div>
          <div className="p-6">
            {/* Scoreboard */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
              <div className="text-center">
                <TeamLogo team={awayTeam} sportKey={game.sport_key} size="lg" className="mx-auto mb-2" />
                <div className="text-sm text-slate-400 mb-1">{game.away_team}</div>
                <div className="text-4xl font-bold text-white">{liveScore.away}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-red-400 text-sm font-semibold mb-1">
                  {liveScore.clock || liveScore.shortStatus}
                </div>
                <div className="text-slate-500 text-xs">{liveScore.status}</div>
              </div>

              <div className="text-center">
                <TeamLogo team={homeTeam} sportKey={game.sport_key} size="lg" className="mx-auto mb-2" />
                <div className="text-sm text-slate-400 mb-1">{game.home_team}</div>
                <div className="text-4xl font-bold text-white">{liveScore.home}</div>
              </div>
            </div>

            {/* Period scores table */}
            {liveScore.homeLinescores?.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <table className="w-full text-center text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="py-2 text-left pl-2">Team</th>
                      {liveScore.homeLinescores.map((_, i) => (
                        <th key={i} className="py-2 px-2 sm:px-4">{i + 1}</th>
                      ))}
                      <th className="py-2 px-2 sm:px-4 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-300 border-b border-slate-700/50">
                      <td className="py-3 text-left pl-2 font-semibold flex items-center gap-2">
                        {liveScore.possession === game.away_team && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Has possession" />
                        )}
                        {liveScore.awayAbbr}
                      </td>
                      {liveScore.awayLinescores.map((score, i) => (
                        <td key={i} className="py-3 px-2 sm:px-4">{score}</td>
                      ))}
                      <td className="py-3 px-2 sm:px-4 font-bold text-white text-lg">{liveScore.away}</td>
                    </tr>
                    <tr className="text-slate-300">
                      <td className="py-3 text-left pl-2 font-semibold flex items-center gap-2">
                        {liveScore.possession === game.home_team && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Has possession" />
                        )}
                        {liveScore.homeAbbr}
                      </td>
                      {liveScore.homeLinescores.map((score, i) => (
                        <td key={i} className="py-3 px-2 sm:px-4">{score}</td>
                      ))}
                      <td className="py-3 px-2 sm:px-4 font-bold text-white text-lg">{liveScore.home}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Timeouts */}
            {(liveScore.awayTimeouts !== undefined || liveScore.homeTimeouts !== undefined) && (
              <div className="flex justify-center gap-8 text-sm">
                <div className="text-slate-400">
                  <span className="text-slate-500">Timeouts:</span> {liveScore.awayAbbr} <span className="text-white font-semibold">{liveScore.awayTimeouts ?? '-'}</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Timeouts:</span> {liveScore.homeAbbr} <span className="text-white font-semibold">{liveScore.homeTimeouts ?? '-'}</span>
                </div>
              </div>
            )}

            {/* Last play */}
            {liveScore.lastPlay && (
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Last Play</div>
                <div className="text-sm text-slate-300">{liveScore.lastPlay}</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="text-center text-xs text-slate-600 p-4">
        <p>Odds are for informational purposes only. Please gamble responsibly.</p>
      </div>
    </div>
  );
}
