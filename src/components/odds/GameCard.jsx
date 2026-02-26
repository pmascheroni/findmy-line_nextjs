import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTeamData } from "../game/useTeamData";
import TeamLogo from "../game/TeamLogo";
import { useUserLocation } from "@/components/AppLayout";
import { useSubscription } from "../subscription/SubscriptionContext";
import { useSettings, ALL_SPORTSBOOKS, ALL_PREDICTION_MARKETS } from "../settings/SettingsContext";

// Format time in user's timezone
function formatTimeInTimezone(date, timezone) {
  try {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  } catch {
    return format(date, "h:mm a");
  }
}

// Helper to convert decimal odds to American
function decimalToAmerican(decimal) {
  if (!decimal || decimal === 1) return null;
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

// Format American odds with + sign
function formatOdds(odds) {
  if (odds === null || odds === undefined) return "-";
  const american = typeof odds === "number" && odds < 10 ? decimalToAmerican(odds) : odds;
  if (american > 0) return `+${american}`;
  return String(american);
}

export default function GameCard({ game, index }) {
  const router = useRouter();
  const { getTeam } = useTeamData();
  const userLocation = useUserLocation();
  const { isPaid } = useSubscription();
  const { selectedSportsbooks, isMarketsMode, selectedPredictionMarkets } = useSettings();
  const [hasHydrated, setHasHydrated] = useState(false);
  const gameTime = new Date(game.commence_time);
  const now = new Date();
  // Game is potentially live if it started within the last 6 hours
  const isPotentiallyLive = now > gameTime && (now - gameTime) < 6 * 60 * 60 * 1000 && !game.completed;
  const timezone = userLocation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeLabel = hasHydrated ? formatTimeInTimezone(gameTime, timezone) : "—";

  useEffect(() => {
    setHasHydrated(true);
  }, []);
  
  // Debug: log games that should be live
  // console.log(`${game.away_team} @ ${game.home_team}: now=${now.toISOString()}, gameTime=${gameTime.toISOString()}, isPotentiallyLive=${isPotentiallyLive}`);

  const awayTeam = getTeam(game.away_team, game.sport_key);
  const homeTeam = getTeam(game.home_team, game.sport_key);
  
  const [liveData, setLiveData] = useState(null);
  const [teamRecords, setTeamRecords] = useState({ away: null, home: null });
  
  // Determine if game is actually live based on ESPN data
  const isLive = liveData?.isLive || (isPotentiallyLive && liveData !== null);
  

  
  // Fetch team records AND live data for all games
  useEffect(() => {
    const fetchESPNData = async () => {
      try {
        const sportMap = {
          "americanfootball_nfl": "football/nfl",
          "americanfootball_ncaaf": "football/college-football",
          "basketball_nba": "basketball/nba",
          "basketball_ncaab": "basketball/mens-college-basketball",
          "baseball_mlb": "baseball/mlb",
          "icehockey_nhl": "hockey/nhl"
        };
        
        const espnSport = sportMap[game.sport_key];
        if (!espnSport) return;
        
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${espnSport}/scoreboard`);
        const data = await res.json();
        
        // Normalize team name for matching - expand common abbreviations
        const normalize = (name) => {
          if (!name) return '';
          return name.toLowerCase()
            .replace(/\bst\b/g, 'state')        // St -> State
            .replace(/\bf\.\s*/g, 'f ')         // F. -> F
            .replace(/\(chi\)/g, 'chicago')     // (Chi) -> Chicago
            .replace(/\(oh\)/g, 'ohio')         // (OH) -> Ohio
            .replace(/josé/g, 'jose')           // José -> Jose
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        };
        
        // Get significant words (length > 2, not common words)
        const getKeyWords = (name) => {
          const normalized = normalize(name);
          const common = ['the', 'and', 'state', 'university', 'college'];
          return normalized.split(' ').filter(w => w.length > 2 && !common.includes(w));
        };
        
        // Check if any keyword matches
        const hasMatchingWord = (name1, name2) => {
          const words1 = getKeyWords(name1);
          const words2 = getKeyWords(name2);
          return words1.some(w1 => words2.some(w2 => 
            w1 === w2 || w1.includes(w2) || w2.includes(w1)
          ));
        };
        
        // Find matching game from ESPN data
        let matchingGame = null;
        
        // Debug: Log what we're searching for
        console.log(`[GameCard] Looking for: "${game.away_team}" @ "${game.home_team}" in ${espnSport}`);
        
        for (const event of data.events || []) {
          const competition = event.competitions?.[0];
          const competitors = competition?.competitors || [];
          
          const homeComp = competitors.find(c => c.homeAway === "home");
          const awayComp = competitors.find(c => c.homeAway === "away");
          
          if (!homeComp || !awayComp) continue;
          
          // Try multiple name variations
          const espnHomeNames = [
            homeComp.team?.displayName,
            homeComp.team?.shortDisplayName,
            homeComp.team?.name,
            homeComp.team?.nickname
          ].filter(Boolean);
          
          const espnAwayNames = [
            awayComp.team?.displayName,
            awayComp.team?.shortDisplayName,
            awayComp.team?.name,
            awayComp.team?.nickname
          ].filter(Boolean);
          
          const homeMatch = espnHomeNames.some(espnName => hasMatchingWord(espnName, game.home_team));
          const awayMatch = espnAwayNames.some(espnName => hasMatchingWord(espnName, game.away_team));
          
          // Debug log
          const espnHomeDisplay = homeComp.team?.displayName || '';
          const espnAwayDisplay = awayComp.team?.displayName || '';
          
          if (homeMatch && awayMatch) {
            console.log(`[GameCard] MATCHED: ESPN "${espnAwayDisplay}" @ "${espnHomeDisplay}"`);
            matchingGame = event;
            break;
          }
        }
        
        if (!matchingGame) {
          console.log(`[GameCard] NO MATCH found for "${game.away_team}" @ "${game.home_team}"`);
        }
        
        if (matchingGame) {
          const competition = matchingGame.competitions?.[0];
          const homeComp = competition?.competitors?.find(c => c.homeAway === "home");
          const awayComp = competition?.competitors?.find(c => c.homeAway === "away");
          const gameState = matchingGame.status?.type?.state;
          
          // Always set records
          setTeamRecords({
            home: homeComp?.records?.[0]?.summary || null,
            away: awayComp?.records?.[0]?.summary || null
          });
          
          // Set live data if game is in progress or completed
          console.log(`[GameCard] Game state: "${gameState}" for "${game.away_team}" @ "${game.home_team}"`);
          if (gameState === "in" || gameState === "post") {
            console.log(`[GameCard] Setting LIVE data: ${awayComp?.score} - ${homeComp?.score}`);
            setLiveData({
              homeScore: homeComp?.score || "0",
              awayScore: awayComp?.score || "0",
              status: matchingGame.status?.type?.shortDetail || "Live",
              period: matchingGame.status?.period,
              clock: matchingGame.status?.displayClock,
              isLive: gameState === "in",
              isComplete: gameState === "post"
            });
          }
        }
      } catch (err) {
        console.error("Error fetching ESPN data:", err);
      }
    };
    
    fetchESPNData();
    
    // Refresh every 30 seconds for all games (to catch when they go live)
    const interval = setInterval(fetchESPNData, 30000);
    return () => clearInterval(interval);
  }, [game.sport_key, game.home_team, game.away_team]);
  
  // Get spread odds for preview - show 2 on mobile, 3 on desktop
  const getSpreadOdds = (isMobile = false) => {
    if (!game.bookmakers?.length) return [];

    const spreadsData = [];
    const count = isMobile ? 2 : 3;

    if (isMarketsMode) {
      // For prediction markets, show data from us_ex bookmakers
      const marketsToShow = selectedPredictionMarkets.slice(0, count);

      for (const marketKey of marketsToShow) {
        const book = game.bookmakers.find(b => b.key === marketKey);
        const market = ALL_PREDICTION_MARKETS.find(m => m.key === marketKey);

        if (book) {
          // Prediction markets typically have h2h (moneyline) odds
          const h2h = book.markets?.find(m => m.key === "h2h");
          const spreads = book.markets?.find(m => m.key === "spreads");

          if (h2h?.outcomes) {
            const awayOdds = h2h.outcomes.find(o => o.name === game.away_team);
            const homeOdds = h2h.outcomes.find(o => o.name === game.home_team);
            spreadsData.push({
              key: marketKey,
              name: market?.short || marketKey,
              isPredictionMarket: true,
              away: awayOdds ? { odds: awayOdds.price } : null,
              home: homeOdds ? { odds: homeOdds.price } : null
            });
          } else if (spreads?.outcomes) {
            const awaySpread = spreads.outcomes.find(o => o.name === game.away_team);
            const homeSpread = spreads.outcomes.find(o => o.name === game.home_team);
            spreadsData.push({
              key: marketKey,
              name: market?.short || marketKey,
              isPredictionMarket: true,
              away: awaySpread ? { point: awaySpread.point, odds: awaySpread.price } : null,
              home: homeSpread ? { point: homeSpread.point, odds: homeSpread.price } : null
            });
          }
        } else {
          // Market not available for this game
          spreadsData.push({
            key: marketKey,
            name: market?.short || marketKey,
            isPredictionMarket: true,
            away: null,
            home: null
          });
        }
      }
      return spreadsData;
    }

    // Sportsbooks mode
    const booksToShow = ["draftkings", "fanduel", "betmgm"].slice(0, count);

    for (const bookKey of booksToShow) {
      const book = game.bookmakers.find(b => b.key === bookKey);
      if (book) {
        const spreads = book.markets?.find(m => m.key === "spreads");
        if (spreads?.outcomes) {
          const awaySpread = spreads.outcomes.find(o => o.name === game.away_team);
          const homeSpread = spreads.outcomes.find(o => o.name === game.home_team);
          spreadsData.push({
            key: bookKey,
            name: ALL_SPORTSBOOKS.find(b => b.key === bookKey)?.short || bookKey,
            away: awaySpread ? { point: awaySpread.point, odds: awaySpread.price } : null,
            home: homeSpread ? { point: homeSpread.point, odds: homeSpread.price } : null
          });
        }
      }
    }
    return spreadsData;
  };

  const spreadOdds = getSpreadOdds(false); // desktop
  const spreadOddsMobile = getSpreadOdds(true); // mobile (2 books)

  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`game_${game.id}`, JSON.stringify(game));
    }
    router.push(`/game/${game.id}?sport=${game.sport_key}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div
        onClick={handleClick}
        className="block group cursor-pointer"
        data-game-id={game.id}
        data-sport-key={game.sport_key}
      >
        <div className={`relative bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border overflow-hidden hover:border-blue-500/50 hover:bg-slate-800/30 transition-all duration-200 ${liveData?.isLive ? 'border-red-500/50' : 'border-slate-800/50'}`}>
          {/* Live indicator badge */}
          {liveData?.isLive && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 rounded-full z-10">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-medium">LIVE</span>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center justify-between">
              {/* Teams */}
              <div className="flex items-center gap-4 flex-1">
                {liveData && (liveData.isLive || liveData.isComplete) ? (
                  // Live game layout with scores
                  <div className="flex items-center gap-2 sm:gap-4 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <TeamLogo team={awayTeam} sportKey={game.sport_key} size="sm" />
                      <div className="hidden sm:block">
                        <div className="font-semibold text-white text-sm">{awayTeam?.short_name || game.away_team.split(' ').pop()}</div>
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-white min-w-[28px] sm:min-w-[40px] text-center">{liveData.awayScore}</div>
                    </div>

                    <div className="flex flex-col items-center px-1 sm:px-3">
                      {liveData.isLive ? (
                        <span className="flex items-center gap-1 text-red-400 text-[10px] sm:text-xs">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="hidden sm:inline">{liveData.status}</span>
                          <span className="sm:hidden">LIVE</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] sm:text-xs font-medium">
                          {liveData.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="text-lg sm:text-2xl font-bold text-white min-w-[28px] sm:min-w-[40px] text-center">{liveData.homeScore}</div>
                      <div className="hidden sm:block">
                        <div className="font-semibold text-white text-sm">{homeTeam?.short_name || game.home_team.split(' ').pop()}</div>
                      </div>
                      <TeamLogo team={homeTeam} sportKey={game.sport_key} size="sm" />
                    </div>
                  </div>
                ) : (
                  // Pre-game layout with logos next to team names
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 mb-1">
                        {/* Away team with logo */}
                        <div className="flex items-center gap-2">
                          <TeamLogo team={awayTeam} sportKey={game.sport_key} size="sm" />
                          <span className="font-semibold text-white text-sm truncate">{awayTeam?.short_name || game.away_team.split(' ').pop()}</span>
                          {teamRecords.away && (
                            <span className="text-slate-500 text-xs hidden sm:inline">({teamRecords.away})</span>
                          )}
                        </div>
                        {/* Home team with logo */}
                        <div className="flex items-center gap-2">
                          <TeamLogo team={homeTeam} sportKey={game.sport_key} size="sm" />
                          <span className="font-semibold text-white text-sm truncate">{homeTeam?.short_name || game.home_team.split(' ').pop()}</span>
                          {teamRecords.home && (
                            <span className="text-slate-500 text-xs hidden sm:inline">({teamRecords.home})</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 sm:gap-1.5 text-slate-400 text-xs sm:text-sm">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1 sm:gap-2 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0">
                <span className="text-sm hidden sm:inline">View Odds</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            {/* Odds Preview - Mobile (2 books) */}
            {spreadOddsMobile.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/50 sm:hidden">
                {isMarketsMode ? (
                  /* Prediction Markets View - Mobile */
                  <>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-slate-500">ML</div>
                      {spreadOddsMobile.map((market) => (
                        <div key={market.key} className="text-center text-purple-400 font-medium">
                          {market.name}
                        </div>
                      ))}
                    </div>

                    {/* Away team odds */}
                    <div className="grid grid-cols-3 gap-2 text-xs mt-1.5">
                      <div className="text-slate-400 truncate">{awayTeam?.short_name || game.away_team.split(' ').pop()}</div>
                      {spreadOddsMobile.map((market, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={market.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">+150</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : market.away ? (
                              <span className="text-slate-300">
                                {market.away.point !== undefined && (
                                  <>{market.away.point > 0 ? '+' : ''}{market.away.point} </>
                                )}
                                <span className="text-purple-400">{formatOdds(market.away.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Home team odds */}
                    <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                      <div className="text-slate-400 truncate">{homeTeam?.short_name || game.home_team.split(' ').pop()}</div>
                      {spreadOddsMobile.map((market, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={market.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">-180</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : market.home ? (
                              <span className="text-slate-300">
                                {market.home.point !== undefined && (
                                  <>{market.home.point > 0 ? '+' : ''}{market.home.point} </>
                                )}
                                <span className="text-purple-400">{formatOdds(market.home.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Sportsbooks View - Mobile */
                  <>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-slate-500">Spread</div>
                      {spreadOddsMobile.map((book) => (
                        <div key={book.key} className="text-center text-slate-500 font-medium">
                          {book.name}
                        </div>
                      ))}
                    </div>

                    {/* Away team spreads */}
                    <div className="grid grid-cols-3 gap-2 text-xs mt-1.5">
                      <div className="text-slate-400 truncate">{awayTeam?.short_name || game.away_team.split(' ').pop()}</div>
                      {spreadOddsMobile.map((book, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={book.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">-3.5</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : book.away ? (
                              <span className="text-slate-300">
                                {book.away.point > 0 ? '+' : ''}{book.away.point}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Home team spreads */}
                    <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                      <div className="text-slate-400 truncate">{homeTeam?.short_name || game.home_team.split(' ').pop()}</div>
                      {spreadOddsMobile.map((book, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={book.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">+3.5</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : book.home ? (
                              <span className="text-slate-300">
                                {book.home.point > 0 ? '+' : ''}{book.home.point}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Odds Preview - Desktop (3 books) */}
            {spreadOdds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/50 hidden sm:block">
                {isMarketsMode ? (
                  /* Prediction Markets View */
                  <>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-slate-500">Moneyline</div>
                      {spreadOdds.map((market) => (
                        <div key={market.key} className="text-center text-purple-400 font-medium">
                          {market.name}
                        </div>
                      ))}
                    </div>

                    {/* Away team odds */}
                    <div className="grid grid-cols-4 gap-2 text-xs mt-1.5">
                      <div className="text-slate-400 truncate">{awayTeam?.short_name || game.away_team.split(' ').pop()}</div>
                      {spreadOdds.map((market, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={market.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">+150</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : market.away ? (
                              <span className="text-slate-300">
                                {market.away.point !== undefined && (
                                  <>{market.away.point > 0 ? '+' : ''}{market.away.point} </>
                                )}
                                <span className="text-purple-400">{formatOdds(market.away.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Home team odds */}
                    <div className="grid grid-cols-4 gap-2 text-xs mt-1">
                      <div className="text-slate-400 truncate">{homeTeam?.short_name || game.home_team.split(' ').pop()}</div>
                      {spreadOdds.map((market, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={market.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">-180</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : market.home ? (
                              <span className="text-slate-300">
                                {market.home.point !== undefined && (
                                  <>{market.home.point > 0 ? '+' : ''}{market.home.point} </>
                                )}
                                <span className="text-purple-400">{formatOdds(market.home.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Sportsbooks View */
                  <>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-slate-500">Spread</div>
                      {spreadOdds.map((book) => (
                        <div key={book.key} className="text-center text-slate-500 font-medium">
                          {book.name}
                        </div>
                      ))}
                    </div>

                    {/* Away team spreads */}
                    <div className="grid grid-cols-4 gap-2 text-xs mt-1.5">
                      <div className="text-slate-400 truncate">{awayTeam?.short_name || game.away_team.split(' ').pop()}</div>
                      {spreadOdds.map((book, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={book.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">-3.5 -110</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : book.away ? (
                              <span className="text-slate-300">
                                {book.away.point > 0 ? '+' : ''}{book.away.point} <span className="text-slate-500">{formatOdds(book.away.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Home team spreads */}
                    <div className="grid grid-cols-4 gap-2 text-xs mt-1">
                      <div className="text-slate-400 truncate">{homeTeam?.short_name || game.home_team.split(' ').pop()}</div>
                      {spreadOdds.map((book, idx) => {
                        const isFirst = idx === 0;
                        const shouldBlur = !isPaid && !isFirst;
                        return (
                          <div key={book.key} className="text-center relative">
                            {shouldBlur ? (
                              <div className="flex items-center justify-center gap-1 text-slate-600">
                                <span className="blur-sm select-none">+3.5 -110</span>
                                <Lock className="w-2.5 h-2.5 text-amber-500/70 absolute" />
                              </div>
                            ) : book.home ? (
                              <span className="text-slate-300">
                                {book.home.point > 0 ? '+' : ''}{book.home.point} <span className="text-slate-500">{formatOdds(book.home.odds)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
