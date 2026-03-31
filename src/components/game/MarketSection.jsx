import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OddsCell from "../odds/OddsCell";
import BlurredOddsCell from "../odds/BlurredOddsCell";
import { useBetSlip } from "./BetSlipContext";
import { useSettings, ALL_PREDICTION_MARKETS } from "../settings/SettingsContext";
import { useSubscription } from "../subscription/SubscriptionContext";

export default function MarketSection({ title, marketKey, game, icon, onBetSelect, selectedBet }) {
  const [expanded, setExpanded] = useState(true);
  const { addBet, isBetSelected } = useBetSlip();
  const { getSportsbooks, isMarketsMode, selectedPredictionMarkets } = useSettings();
  const { isPaid } = useSubscription();
  
  // Get the appropriate list of books/markets based on mode
  const SPORTSBOOKS = isMarketsMode 
    ? selectedPredictionMarkets.map(key => {
        const market = ALL_PREDICTION_MARKETS.find(m => m.key === key);
        return { key, name: market?.name || key, short: market?.short || key };
      })
    : getSportsbooks();

  // Find best odds for each outcome - only highlight ONE book per row (first with best odds)
  const findBest = (outcomeName, outcomeDescription, pointValue = null) => {
    let bestOdds = -Infinity;
    let bestBook = null;
    
    // Check sportsbooks in display order to find first with best odds
    SPORTSBOOKS.forEach(sbConfig => {
      const book = game.bookmakers?.find(b => b.key === sbConfig.key);
      if (!book) return;
      
      const market = book.markets?.find(m => m.key === marketKey);
      const outcome = market?.outcomes?.find(o => {
        if (outcomeDescription && o.description !== outcomeDescription) return false;
        if (o.name !== outcomeName) return false;
        if (pointValue !== null) {
          return o.point === pointValue;
        }
        return true;
      });
      
      if (outcome?.price > bestOdds) {
        bestOdds = outcome.price;
        bestBook = book.key;
      }
    });
    
    return { odds: bestOdds, books: bestBook ? [bestBook] : [] };
  };

  // Get all unique outcomes for this market
  const getOutcomes = () => {
    const outcomes = new Map();
    
    game.bookmakers?.forEach(book => {
      const market = book.markets?.find(m => m.key === marketKey);
      market?.outcomes?.forEach(o => {
        const keyParts = [o.description || "", o.name, o.point !== undefined ? o.point : ""];
        const key = keyParts.join("|");
        if (!outcomes.has(key)) {
          outcomes.set(key, { name: o.name, point: o.point, description: o.description });
        }
      });
    });
    
    return Array.from(outcomes.values());
  };

  const outcomes = getOutcomes();
  
  if (outcomes.length === 0) return null;

  // Group outcomes for display
  const isSpread = marketKey === "spreads" || marketKey.includes("spread");
  const isTotal = marketKey === "totals" || marketKey.includes("total");

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-white">{title}</span>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {outcomes.length} options
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-t border-slate-800/50">
                    <th className="px-4 py-2 text-left font-medium sticky left-0 z-10 bg-slate-900 min-w-[120px]">Selection</th>
                    {SPORTSBOOKS.map(book => (
                      <th key={book.key} className={`px-3 py-2 text-center font-medium min-w-[80px] ${isMarketsMode ? 'text-purple-400' : ''}`}>
                        {book.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outcomes.map((outcome, idx) => {
                    const best = findBest(outcome.name, outcome.description, outcome.point);
                    const displayName = outcome.description || outcome.name;
                    const secondaryLabel = outcome.description ? outcome.name : null;
                    const outcomeLabel = outcome.description
                      ? `${outcome.description} ${outcome.name}`
                      : outcome.name;
                    
                    return (
                      <tr key={idx} className="border-t border-slate-800/30 hover:bg-slate-800/20">
                        <td className="px-4 py-2 sticky left-0 z-10 bg-slate-900 min-w-[120px]">
                          <div className="flex flex-col">
                            <span className="font-medium text-white text-xs sm:text-sm">
                              {displayName}
                            </span>
                            {secondaryLabel && (
                              <span className="text-slate-400 text-xs">
                                {secondaryLabel}
                              </span>
                            )}
                            {outcome.point !== undefined && (
                              <span className="text-slate-400 text-xs">
                                ({outcome.point > 0 ? `+${outcome.point}` : outcome.point})
                              </span>
                            )}
                          </div>
                        </td>
                        {SPORTSBOOKS.map((book, bookIdx) => {
                          // Free users only see first sportsbook with real data
                          const isLocked = !isPaid && bookIdx > 0;
                          
                          const bookmaker = game.bookmakers?.find(b => b.key === book.key);
                          const market = bookmaker?.markets?.find(m => m.key === marketKey);
                          const bookOutcome = market?.outcomes?.find(o => {
                            if (outcome.description && o.description !== outcome.description) {
                              return false;
                            }
                            if (o.name !== outcome.name) return false;
                            if (outcome.point !== undefined) {
                              return o.point === outcome.point;
                            }
                            return true;
                          });
                          
                          // For locked cells, generate demo "best" indicator randomly based on position
                          const demoBest = isLocked && ((bookIdx + idx) % 3 === 0);
                          
                          if (isLocked) {
                            return (
                              <td key={book.key} className="px-2 py-1 text-center">
                                <BlurredOddsCell isBest={demoBest} />
                              </td>
                            );
                          }
                          
                          const isSelected = isBetSelected(
                            game.id,
                            marketKey,
                            outcomeLabel,
                            book.name,
                            outcome.point
                          );

                          const handleAddBet = () => {
                            if (!bookOutcome?.price) return;
                            
                            addBet({
                              gameId: game.id,
                              market: marketKey,
                              marketName: title,
                              outcome: outcomeLabel,
                              point: outcome.point,
                              odds: bookOutcome.price,
                              sportsbook: book.name,
                              awayTeam: game.away_team,
                              homeTeam: game.home_team
                            });
                          };
                          
                          const isBestOdds = best.books.includes(book.key);
                          return (
                            <td key={book.key} className="px-2 py-1 text-center">
                              <OddsCell
                                odds={bookOutcome?.price}
                                isBest={isBestOdds}
                                onClick={handleAddBet}
                                isSelected={isSelected}
                                dataTour={isBestOdds ? "best-odds" : undefined}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
