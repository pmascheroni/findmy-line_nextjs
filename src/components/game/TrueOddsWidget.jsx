"use client";

import { useMemo } from "react";

function americanToImplied(odds) {
  if (!Number.isFinite(odds)) return null;
  if (odds >= 100) return 100 / (odds + 100);
  return (-odds) / (-odds + 100);
}

function impliedToAmerican(prob) {
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) return null;
  if (prob >= 0.5) return Math.round((-prob / (1 - prob)) * 100);
  return Math.round(((1 - prob) / prob) * 100);
}

// Helper to get market type from selection
function getMarketTypeFromSelection(selection) {
  if (!selection) return null;
  if (selection.marketKey === 'h2h') return 'moneyline';
  if (selection.marketKey === 'spreads') return 'spread';
  if (selection.marketKey === 'totals') return 'total';
  if (selection.marketKey.includes('player_') || selection.marketKey.includes('prop')) return 'prop';
  return 'other';
}

export default function TrueOddsWidget({ game, selectedBet = null, onBetSelect }) {
  // Calculate true odds for specific selection or overall
  const trueOdds = useMemo(() => {
    if (!game) return [];

    // If a specific bet is selected, calculate true odds for that selection only
    if (selectedBet) {
      const { marketKey, outcomeName, point } = selectedBet;
      
      // Collect all odds for this specific selection across bookmakers
      const oddsList = [];
      
      (game.bookmakers || []).forEach((book) => {
        const market = (book.markets || []).find((m) => m.key === marketKey);
        if (!market) return;
        
        const outcome = (market.outcomes || []).find(o => 
          o.name === outcomeName && 
          (point === undefined || o.point === point)
        );
        
        if (outcome && outcome.price !== undefined) {
          oddsList.push(outcome.price);
        }
      });
      
      if (oddsList.length === 0) return [];
      
      // Calculate average implied probability for this selection
      const impliedProbs = oddsList.map(americanToImplied).filter(p => p !== null);
      if (impliedProbs.length === 0) return [];
      
      const avgProb = impliedProbs.reduce((a, b) => a + b, 0) / impliedProbs.length;
      const trueAmerican = impliedToAmerican(avgProb);
      const bestAvailable = Math.max(...oddsList);
      
      // Calculate implied probability of the opposite outcome if possible
      let oppositeProb = null;
      let oppositeBestOdds = null;
      
      // Try to find opposite outcome for binary markets
      if (marketKey === 'h2h' || marketKey === 'spreads' || marketKey === 'totals') {
        const oppositeOddsList = [];
        
        (game.bookmakers || []).forEach((book) => {
          const market = (book.markets || []).find((m) => m.key === marketKey);
          if (!market) return;
          
          // Find the other outcome in this market
          const otherOutcome = (market.outcomes || []).find(o => 
            o.name !== outcomeName && 
            (point === undefined || o.point === point)
          );
          
          if (otherOutcome && otherOutcome.price !== undefined) {
            oppositeOddsList.push(otherOutcome.price);
          }
        });
        
        if (oppositeOddsList.length > 0) {
          const oppositeImplied = oppositeOddsList.map(americanToImplied).filter(p => p !== null);
          if (oppositeImplied.length > 0) {
            oppositeProb = oppositeImplied.reduce((a, b) => a + b, 0) / oppositeImplied.length;
            oppositeBestOdds = Math.max(...oppositeOddsList);
          }
        }
      }
      
      // Format selection label
      let selectionLabel = outcomeName;
      if (point !== undefined) {
        const pointStr = point > 0 ? `+${point}` : point;
        selectionLabel = `${outcomeName} ${pointStr}`;
      }
      
      return [{
        name: selectionLabel,
        probability: Math.round(avgProb * 1000) / 10,
        trueAmerican,
        bestAvailable,
        isSelected: true,
        oppositeProb: oppositeProb ? Math.round(oppositeProb * 1000) / 10 : null,
        oppositeBestOdds
      }];
    }
    
    // Default: calculate for all moneyline outcomes
    const outcomeMap = new Map(); // outcomeName -> [implied probs]

    (game.bookmakers || []).forEach((book) => {
      const market = (book.markets || []).find((m) => m.key === "h2h");
      if (!market) return;
      (market.outcomes || []).forEach((outcome) => {
        const prob = americanToImplied(outcome.price);
        if (prob === null) return;
        if (!outcomeMap.has(outcome.name)) outcomeMap.set(outcome.name, []);
        outcomeMap.get(outcome.name).push(prob);
      });
    });

    if (outcomeMap.size === 0) return [];

    // Average implied probabilities per outcome
    const rawAvgs = Array.from(outcomeMap.entries()).map(([name, probs]) => ({
      name,
      avgProb: probs.reduce((a, b) => a + b, 0) / probs.length,
    }));

    // Normalize so probabilities sum to 1
    const total = rawAvgs.reduce((sum, o) => sum + o.avgProb, 0);
    const normalized = rawAvgs.map((o) => ({
      ...o,
      normalizedProb: total > 0 ? o.avgProb / total : o.avgProb,
    }));

    // Find best available odds per outcome
    const bestOdds = new Map();
    (game.bookmakers || []).forEach((book) => {
      const market = (book.markets || []).find((m) => m.key === "h2h");
      if (!market) return;
      (market.outcomes || []).forEach((outcome) => {
        const current = bestOdds.get(outcome.name);
        if (current === undefined || outcome.price > current) {
          bestOdds.set(outcome.name, outcome.price);
        }
      });
    });

    return normalized.map((o) => ({
      name: o.name,
      probability: Math.round(o.normalizedProb * 1000) / 10,
      trueAmerican: impliedToAmerican(o.normalizedProb),
      bestAvailable: bestOdds.get(o.name) ?? null,
      isSelected: false,
      oppositeProb: null,
      oppositeBestOdds: null
    }));
  }, [game, selectedBet]);

  if (trueOdds.length === 0) return null;

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/50">
        <span className="text-lg">⚖️</span>
        <div>
          <h3 className="font-semibold text-white">True Odds</h3>
          <p className="text-xs text-slate-500">Vig-removed average across all available books</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selection indicator */}
        {selectedBet && (
          <div className="mb-2 p-3 bg-slate-800/40 rounded-lg border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Showing true odds for:</div>
                <div className="text-lg font-bold text-blue-300 mt-1">
                  {selectedBet.outcomeName}
                  {selectedBet.point !== undefined && (
                    <span className="ml-2">({selectedBet.point > 0 ? `+${selectedBet.point}` : selectedBet.point})</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {getMarketTypeFromSelection(selectedBet).toUpperCase()}
                </div>
              </div>
              <div>
                {onBetSelect && (
                  <button 
                    onClick={() => onBetSelect(null)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded border border-slate-700 hover:border-slate-500"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {trueOdds.map((outcome) => {
          const isFavorite = outcome.probability >= 50;
          const trueLabel =
            outcome.trueAmerican !== null
              ? outcome.trueAmerican > 0
                ? `+${outcome.trueAmerican}`
                : `${outcome.trueAmerican}`
              : "—";
          const bestLabel =
            outcome.bestAvailable !== null
              ? outcome.bestAvailable > 0
                ? `+${outcome.bestAvailable}`
                : `${outcome.bestAvailable}`
              : "—";

          return (
            <div key={outcome.name} className={`space-y-2 ${outcome.isSelected ? 'p-3 bg-slate-800/40 rounded-lg border border-blue-500/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white">{outcome.name}</span>
                  {outcome.isSelected && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">SELECTED</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">True Odds</div>
                    <div className="text-sm font-bold text-blue-400">{trueLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Best Available</div>
                    <div className="text-sm font-semibold text-white">{bestLabel}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Implied probability</span>
                  <span className="font-medium text-slate-300">{outcome.probability}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isFavorite ? "bg-blue-500" : "bg-slate-500"}`}
                    style={{ width: `${Math.min(100, outcome.probability)}%` }}
                  />
                </div>
                {outcome.oppositeProb !== null && (
                  <div className="text-xs text-slate-500">
                    Opposite outcome: {outcome.oppositeProb}% (best: {outcome.oppositeBestOdds > 0 ? `+${outcome.oppositeBestOdds}` : outcome.oppositeBestOdds})
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-slate-600 pt-1">
          {selectedBet 
            ? "True odds calculated for selected bet only. Vig removed from average of available books."
            : "Probabilities are vig-removed averages across all sportsbooks. Click any bet to see its true odds."}
        </p>
        {!selectedBet && onBetSelect && (
          <p className="text-xs text-slate-500 text-center mt-2">
            Click any bet on the page to see its true odds here
          </p>
        )}
      </div>
    </div>
  );
}
