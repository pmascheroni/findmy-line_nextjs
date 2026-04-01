"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const debounce = (fn, ms) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

export default function EventSearch({ allCategories = [], allGames = [], allEvents = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const performSearch = (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const lower = q.toLowerCase();

    // Search games
    const matchedGames = (allGames || [])
      .filter(
        (g) =>
          (g.home_team || "").toLowerCase().includes(lower) ||
          (g.away_team || "").toLowerCase().includes(lower) ||
          (g.sport_key || "").toLowerCase().includes(lower)
      )
      .slice(0, 5)
      .map((g) => ({
        type: "game",
        id: g.id,
        title: `${g.away_team} @ ${g.home_team}`,
        subtitle: g.sport_key,
        data: g,
      }));

    // Search events
    const matchedEvents = (allEvents || [])
      .filter(
        (e) =>
          (e.name || "").toLowerCase().includes(lower) ||
          (e.title || "").toLowerCase().includes(lower) ||
          (e.sport_key || "").toLowerCase().includes(lower)
      )
      .slice(0, 5)
      .map((e) => ({
        type: "event",
        id: e.id,
        title: e.name || e.title,
        subtitle: e.sport_key,
        data: e,
      }));

    // Search categories
    const matchedCategories = (allCategories || [])
      .filter((c) => (c.name || "").toLowerCase().includes(lower))
      .slice(0, 3)
      .map((c) => ({
        type: "category",
        id: c.id,
        title: c.name,
        subtitle: c.description || `${c.icon || ""} ${c.name}`,
        data: c,
      }));

    const combined = [...matchedGames, ...matchedEvents, ...matchedCategories];
    setResults(combined.slice(0, 10));
    setLoading(false);
  };

  const debouncedSearch = useCallback(
    debounce(performSearch, 200),
    []
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setIsOpen(true);
      debouncedSearch(value);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search events or leagues..."
          className="w-full pl-9 pr-9 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.trim() || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {loading && !results.length ? (
              <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching…</span>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, i) => (
                  <Link
                    key={`${result.type}-${result.id}-${i}`}
                    href={
                      result.type === "game"
                        ? `/game/${result.id}`
                        : result.type === "category"
                        ? `/?sport=${result.id}`
                        : "#"
                    }
                    onClick={() => { setIsOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-b-0"
                  >
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-sm">
                      {result.type === "game" && "🎯"}
                      {result.type === "event" && "📊"}
                      {result.type === "category" && result.data?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{result.title}</p>
                      <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">
                No results for &quot;{query}&quot;
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
