// src/components/odds/OutrightEventCard.jsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

export default function OutrightEventCard({ event, onBetSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  
  if (!event?.markets?.[0]?.outcomes) return null;
  
  const market = event.markets[0];
  const outcomes = market.outcomes || [];
  
  // Calculate implied probabilities and best odds per outcome
  const outcomesWithData = outcomes.map(outcome => {
    const impliedProb = americanToImplied(outcome.price);
    return {
      ...outcome,
      impliedProb,
      bestOdds: outcome.price,
      bestBookmaker: event.bookmakers?.[0]?.title || 'Unknown'
    };
  });

  // Sort by best odds (most positive to most negative)
  const sortedOutcomes = [...outcomesWithData].sort((a, b) => b.price - a.price);
  
  // Take top 5 for collapsed view
  const topOutcomes = sortedOutcomes.slice(0, 5);
  const remainingOutcomes = sortedOutcomes.slice(5);
  
  // Calculate total implied probability (will be >1 due to vig)
  const totalImplied = sortedOutcomes.reduce((sum, o) => sum + (o.impliedProb || 0), 0);
  
  // Find best odd for each bookmaker (for display header)
  const bookmakers = event.bookmakers || [];

  const handleBetClick = (outcomeName, point, marketKey) => {
    const bet = { marketKey: marketKey || 'win', outcomeName, point, eventTitle: event.title };
    setSelectedBet(bet);
    if (onBetSelect) onBetSelect(bet);
  };

  const clearSelection = () => {
    setSelectedBet(null);
    if (onBetSelect) onBetSelect(null);
  };

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800/70 overflow-hidden">
      {/* Event Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-white">{event.title}</h3>
            <p className="text-sm text-slate-400">Outright / Tournament Winner</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <span className="text-sm">{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {selectedBet && (
          <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Selected:</span>
                <div className="font-medium text-white">{selectedBet.outcomeName}</div>
              </div>
              <button 
                onClick={clearSelection}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        
        {/* Sportsbook header */}
        {bookmakers.length > 0 && (
          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 text-sm font-medium text-slate-400">Participant</div>
            {bookmakers.map(bookmaker => (
              <div key={bookmaker.key} className="text-center w-24">
                <div className="text-xs text-slate-500 mb-1">{bookmaker.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="divide-y divide-slate-800/50">
        {/* Top 5 participants (always shown) */}
        {topOutcomes.map((outcome, idx) => {
          const impliedPercent = totalImplied > 0 ? ((outcome.impliedProb || 0) / totalImplied) * 100 : 0;
          const isSelected = selectedBet?.outcomeName === outcome.name;
          
          return (
            <div 
              key={outcome.name || idx} 
              className={`p-4 hover:bg-slate-800/30 transition ${isSelected ? 'bg-blue-900/20' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <button
                    onClick={() => handleBetClick(outcome.name, outcome.point, market.key)}
                    className="text-left w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400 text-sm w-6 text-right">{idx + 1}</div>
                      <div>
                        <div className="font-medium text-white">{outcome.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Implied probability: {impliedPercent.toFixed(1)}%
                          {isSelected && <span className="ml-2 text-blue-400">✓ Selected</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Odds per bookmaker */}
                {bookmakers.map(bookmaker => {
                  const market = bookmaker.markets?.[0];
                  const bookOutcome = market?.outcomes?.find(o => o.name === outcome.name);
                  const odds = bookOutcome?.price;
                  
                  return (
                    <div key={bookmaker.key} className="text-center w-24">
                      {odds ? (
                        <div>
                          <div className={`text-lg font-bold ${odds > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {odds > 0 ? `+${odds}` : odds}
                          </div>
                          <div className="text-xs text-slate-500">American</div>
                        </div>
                      ) : (
                        <div className="text-slate-700 text-sm">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Probability bar */}
              <div className="mt-2 ml-9">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.min(100, impliedPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Show remaining participants if expanded */}
        {isExpanded && remainingOutcomes.map((outcome, idx) => {
          const impliedPercent = totalImplied > 0 ? ((outcome.impliedProb || 0) / totalImplied) * 100 : 0;
          const isSelected = selectedBet?.outcomeName === outcome.name;
          
          return (
            <div 
              key={outcome.name || idx + 5} 
              className={`p-4 hover:bg-slate-800/30 transition ${isSelected ? 'bg-blue-900/20' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <button
                    onClick={() => handleBetClick(outcome.name, outcome.point, market.key)}
                    className="text-left w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400 text-sm w-6 text-right">{idx + 6}</div>
                      <div>
                        <div className="font-medium text-white">{outcome.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Implied probability: {impliedPercent.toFixed(1)}%
                          {isSelected && <span className="ml-2 text-blue-400">✓ Selected</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Odds per bookmaker */}
                {bookmakers.map(bookmaker => {
                  const market = bookmaker.markets?.[0];
                  const bookOutcome = market?.outcomes?.find(o => o.name === outcome.name);
                  const odds = bookOutcome?.price;
                  
                  return (
                    <div key={bookmaker.key} className="text-center w-24">
                      {odds ? (
                        <div>
                          <div className={`text-lg font-bold ${odds > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {odds > 0 ? `+${odds}` : odds}
                          </div>
                          <div className="text-xs text-slate-500">American</div>
                        </div>
                      ) : (
                        <div className="text-slate-700 text-sm">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Show/hide toggle for remaining */}
      {remainingOutcomes.length > 0 && (
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-center text-slate-400 hover:text-white transition text-sm font-medium"
          >
            {isExpanded ? (
              <>Show fewer ({remainingOutcomes.length} hidden) ↑</>
            ) : (
              <>Show {remainingOutcomes.length} more participants ↓</>
            )}
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800/50">
        <p className="text-xs text-slate-500">
          ⚠️ Total implied probability ({totalImplied.toFixed(2)}) includes vig. 
          Probabilities shown are normalized to 100%.
          {onBetSelect && " Click a participant to see its true odds."}
        </p>
      </div>
    </div>
  );
}