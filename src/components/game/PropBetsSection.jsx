// src/components/game/PropBetsSection.jsx
"use client";

import { useState, useEffect } from "react";

function formatOdds(odds) {
  if (odds === null || odds === undefined) return "-";
  if (odds > 0) return `+${odds}`;
  return String(odds);
}

export default function PropBetsSection({ gameId, sportKey, onBetSelect }) {
  const [propsData, setPropsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedBet, setSelectedBet] = useState(null);

  useEffect(() => {
    if (!gameId || !sportKey) return;
    
    const fetchPropBets = async () => {
      try {
        setLoading(true);
        const url = `/api/odds/props/${gameId}?sportKey=${sportKey}&all=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch props: ${response.status}`);
        }
        
        const data = await response.json();
        setPropsData(data.groupedProps || []);
        setError(null);
      } catch (err) {
        console.error("Error loading prop bets:", err);
        setError("Could not load prop bets");
        setPropsData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropBets();
  }, [gameId, sportKey]);

  const handleBetClick = (marketKey, outcomeName, point) => {
    const bet = { marketKey, outcomeName, point };
    setSelectedBet(bet);
    if (onBetSelect) onBetSelect(bet);
  };

  const clearSelection = () => {
    setSelectedBet(null);
    if (onBetSelect) onBetSelect(null);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <div className="text-center">
          <div className="text-yellow-400 mb-2">⚠️</div>
          <p className="text-slate-400">Unable to load prop bets</p>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!propsData || propsData.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <div className="text-center">
          <div className="text-slate-500 mb-2">📊</div>
          <p className="text-slate-400">No prop bets available for this game</p>
          <p className="text-sm text-slate-600 mt-1">
            Prop bets may not be offered for this sport or event
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/50">
        <span className="text-lg">🎯</span>
        <div>
          <h3 className="font-semibold text-white">Prop Bets</h3>
          <p className="text-xs text-slate-500">Player and game-specific propositions</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {selectedBet && (
          <div className="mb-4 p-3 bg-slate-800/40 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-400">Selected prop:</span>
                <div className="text-lg font-bold text-purple-300 mt-1">
                  {selectedBet.outcomeName}
                  {selectedBet.point !== undefined && (
                    <span className="ml-2">({selectedBet.point > 0 ? `+${selectedBet.point}` : selectedBet.point})</span>
                  )}
                </div>
              </div>
              <button 
                onClick={clearSelection}
                className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded border border-slate-700 hover:border-slate-500"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {propsData.map((categoryGroup) => {
          const isExpanded = expandedCategory === categoryGroup.category;
          
          return (
            <div key={categoryGroup.category} className="border border-slate-800/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : categoryGroup.category)}
                className="w-full px-4 py-3 bg-slate-800/30 hover:bg-slate-800/50 transition flex items-center justify-between"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-white">{categoryGroup.category}</h4>
                  <p className="text-xs text-slate-500">
                    {categoryGroup.markets.length} {categoryGroup.markets.length === 1 ? 'market' : 'markets'}
                  </p>
                </div>
                <span className="text-slate-400">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {categoryGroup.markets.map((market) => {
                    // Get list of bookmakers for this market
                    const bookmakers = market.bookmakers || [];
                    
                    return (
                      <div key={market.key} className="space-y-3">
                        <h5 className="font-medium text-slate-300">{market.name}</h5>
                        
                        {bookmakers.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-800">
                                  <th className="text-left py-2 text-slate-400 font-medium">Outcome</th>
                                  {bookmakers.map((bookmaker) => (
                                    <th key={bookmaker.title} className="text-center py-2 text-slate-400 font-medium">
                                      {bookmaker.title}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {market.outcomes.map((outcome, idx) => {
                                  const isSelected = selectedBet?.marketKey === market.key && 
                                                    selectedBet?.outcomeName === outcome.name &&
                                                    selectedBet?.point === outcome.point;
                                  
                                  return (
                                    <tr 
                                      key={`${outcome.name}-${idx}`}
                                      className={`border-b border-slate-800/50 ${isSelected ? 'bg-purple-900/20' : 'hover:bg-slate-800/30'} transition`}
                                    >
                                      <td className="py-2">
                                        <button
                                          onClick={() => handleBetClick(market.key, outcome.name, outcome.point)}
                                          className={`text-left w-full py-1 px-2 rounded hover:bg-slate-700/30 ${isSelected ? 'bg-purple-900/30' : ''}`}
                                        >
                                          <div className="font-medium text-white">{outcome.name}</div>
                                          {outcome.point !== undefined && (
                                            <div className="text-xs text-slate-500">
                                              Line: {outcome.point > 0 ? `+${outcome.point}` : outcome.point}
                                            </div>
                                          )}
                                        </button>
                                      </td>
                                      {bookmakers.map((bookmaker) => {
                                        const odds = bookmaker.outcomes[`${outcome.name}|${outcome.point || ''}`];
                                        return (
                                          <td key={bookmaker.title} className="text-center py-2">
                                            <div className={`font-bold ${odds > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                              {formatOdds(odds)}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-600">
                            No bookmakers offering this market
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="text-xs text-slate-600 pt-2">
          <p>Click any prop to select it. Available props vary by sportbook and event.</p>
          <p className="mt-1">
            ⚠️ Player props may have limited availability. Alternate totals/spreads are shown as Game Props.
          </p>
        </div>
      </div>
    </div>
  );
}