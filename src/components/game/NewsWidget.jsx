"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Newspaper, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NewsWidget({ homeTeam, awayTeam, sportKey }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const homeTeamName = typeof homeTeam === "string" ? homeTeam : homeTeam?.name;
    const awayTeamName = typeof awayTeam === "string" ? awayTeam : awayTeam?.name;
    if (!sportKey || !homeTeamName || !awayTeamName) { setLoading(false); return; }

    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({ sportKey, homeTeam: homeTeamName, awayTeam: awayTeamName });
        const res = await fetch(`/api/espn/news?${params}`);
        const json = await res.json();
        if (!cancelled) setArticles(json.articles || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [homeTeam, awayTeam, sportKey]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 mb-6 animate-pulse">
        <div className="h-5 w-36 bg-slate-800 rounded" />
      </div>
    );
  }

  if (articles.length === 0) return null;

  const visibleArticles = isExpanded ? articles : articles.slice(0, 3);

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 mb-6">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">GAME NEWS</h3>
            <p className="text-xs text-slate-500">{articles.length} article{articles.length !== 1 ? "s" : ""} · ESPN</p>
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-0 divide-y divide-slate-800/60">
              {visibleArticles.map((article, i) => (
                <a
                  key={i}
                  href={article.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 py-3 group hover:bg-slate-800/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-700"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {article.headline}
                    </p>
                    {article.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {article.published && (
                        <span className="text-[9px] text-slate-600">
                          {formatDistanceToNow(new Date(article.published), { addSuffix: true })}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600">· {article.source || "ESPN"}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 3 && !isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                className="w-full mt-2 text-xs text-blue-400 hover:text-blue-300 py-1"
              >
                Show {articles.length - 3} more articles
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
