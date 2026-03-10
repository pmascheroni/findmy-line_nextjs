import { ExternalLink } from "lucide-react";

const SOURCE_META = {
  polymarket: {
    label: "Polymarket",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  kalshi: {
    label: "Kalshi",
    className: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  },
  robinhood: {
    label: "Robinhood",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  fanduel: {
    label: "FanDuel",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "—";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
};

export default function PredictionMarketComparisonTable({ marketGroup, categoryLabel }) {
  if (!marketGroup) return null;

  const sources = Array.isArray(marketGroup.sources) ? marketGroup.sources : [];
  const outcomes = Array.isArray(marketGroup.outcomes) ? marketGroup.outcomes : [];

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-white">{marketGroup.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {sources.map((source) => {
              const meta = SOURCE_META[source.key] || {
                label: source.label || source.key,
                className: "bg-slate-700/40 text-slate-300 border-slate-600/40",
              };
              return (
                <span key={source.key} className={`px-2 py-0.5 rounded-full border ${meta.className}`}>
                  {meta.label}
                </span>
              );
            })}
            {categoryLabel && (
              <span className="px-2 py-0.5 rounded-full border border-slate-700/60 text-slate-400">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {sources.map((source) =>
            source.url ? (
              <a
                key={`${source.key}-url`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {SOURCE_META[source.key]?.label || source.label || source.key}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60 text-slate-400">
              <th className="py-2 pr-3 text-left font-medium">Outcome</th>
              {sources.map((source) => (
                <th key={source.key} className="py-2 px-3 text-left font-medium whitespace-nowrap">
                  {SOURCE_META[source.key]?.label || source.label || source.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome) => (
              <tr key={`${marketGroup.id}-${outcome.name}`} className="border-b border-slate-900/80 last:border-0">
                <td className="py-3 pr-3 text-white font-medium align-top">{outcome.name}</td>
                {sources.map((source) => {
                  const sourceOutcome = outcome.prices?.[source.key];
                  return (
                    <td key={`${outcome.name}-${source.key}`} className="py-3 px-3 align-top">
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-2 min-w-[88px] text-white font-semibold">
                        {formatPercent(sourceOutcome?.price)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
