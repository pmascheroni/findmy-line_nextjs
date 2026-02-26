import { ExternalLink } from "lucide-react";

const SOURCE_STYLES = {
  polymarket: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  kalshi: "bg-pink-500/20 text-pink-300 border-pink-500/40",
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
};

export default function PredictionMarketCard({ market, categoryLabel }) {
  if (!market) return null;
  const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
  const primaryOutcomes = outcomes.slice(0, 2);
  const extraCount = outcomes.length - primaryOutcomes.length;
  const sourceLabel = market.source === "kalshi" ? "Kalshi" : "Polymarket";
  const sourceClass = SOURCE_STYLES[market.source] || "bg-slate-700/40 text-slate-300 border-slate-600/40";

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-white">{market.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full border ${sourceClass}`}>
              {sourceLabel}
            </span>
            {categoryLabel && (
              <span className="px-2 py-0.5 rounded-full border border-slate-700/60 text-slate-400">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>
        {market.url && (
          <a
            href={market.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            View
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {primaryOutcomes.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {primaryOutcomes.map((outcome) => (
            <div
              key={`${market.id}-${outcome.name}`}
              className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-2"
            >
              <div className="text-xs text-slate-400">{outcome.name}</div>
              <div className="text-lg font-semibold text-white">
                {formatPercent(outcome.price) || "—"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-xs text-slate-500">No pricing available.</div>
      )}

      {extraCount > 0 && (
        <div className="mt-2 text-xs text-slate-500">+{extraCount} more outcomes</div>
      )}
    </div>
  );
}
