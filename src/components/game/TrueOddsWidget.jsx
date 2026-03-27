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

export default function TrueOddsWidget({ game }) {
  const trueOdds = useMemo(() => {
    if (!game) return [];

    // Gather all h2h outcomes from all bookmakers
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
      probability: Math.round(o.normalizedProb * 1000) / 10, // e.g. 53.2
      trueAmerican: impliedToAmerican(o.normalizedProb),
      bestAvailable: bestOdds.get(o.name) ?? null,
    }));
  }, [game]);

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
            <div key={outcome.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{outcome.name}</span>
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
                    style={{ width: `${outcome.probability}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-slate-600 pt-1">
          Probabilities are vig-removed averages across all sportsbooks. Not financial advice.
        </p>
      </div>
    </div>
  );
}
