"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BarChart2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GameStatsWidget({ homeTeam, awayTeam, sportKey, commenceTime }) {
  const [data, setData] = useState(null);
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
        if (commenceTime) params.set("commenceTime", commenceTime);
        const res = await fetch(`/api/espn/game-stats?${params}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [homeTeam, awayTeam, sportKey, commenceTime]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 mb-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!data?.found) return null;

  const { home, away } = data;
  const hasLeaders = (home.leaders?.length || 0) + (away.leaders?.length || 0) > 0;
  const hasStats = (home.stats?.length || 0) + (away.stats?.length || 0) > 0;
  if (!hasLeaders && !hasStats) return null;

  // Build bar chart data — merge home + away stats by key
  const statKeys = home.stats?.map((s) => s.key) || [];
  const mergedStats = statKeys.map((key) => {
    const h = home.stats.find((s) => s.key === key);
    const a = away.stats.find((s) => s.key === key);
    if (!h || !a) return null;
    const hVal = parseFloat(h.value) || 0;
    const aVal = parseFloat(a.value) || 0;
    const max = Math.max(hVal, aVal, 0.01);
    return { key, label: h.label, homeVal: hVal, awayVal: aVal, homeDisplay: h.value, awayDisplay: a.value, max };
  }).filter(Boolean);

  // Leaders: pair home[i] and away[i] by category (PTS, AST, REB)
  const leaderCategories = Math.max(home.leaders?.length || 0, away.leaders?.length || 0);

  const Headshot = ({ src, name, size = "w-10 h-10" }) =>
    src ? (
      <img src={src} alt={name} className={`${size} rounded-full object-cover bg-slate-700 flex-shrink-0`}
        onError={(e) => { e.target.style.display = "none"; }} />
    ) : (
      <div className={`${size} rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0`}>
        <User className="w-4 h-4 text-slate-500" />
      </div>
    );

  const TeamLogo = ({ logo, abbrev, size = "w-6 h-6" }) =>
    logo ? (
      <img src={logo} alt={abbrev} className={`${size} object-contain flex-shrink-0`}
        onError={(e) => { e.target.style.display = "none"; }} />
    ) : null;

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 mb-6">
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">SEASON STATS</h3>
            <p className="text-xs text-slate-500">
              {away.abbrev || away.name?.split(" ").pop()} vs {home.abbrev || home.name?.split(" ").pop()} · Season leaders &amp; team stats
            </p>
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
            <div className="mt-5 space-y-6">

              {/* ── SEASON LEADERS ── */}
              {hasLeaders && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3 px-1">
                    Season Leaders
                  </div>

                  {/* Team header row */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo logo={away.logo} abbrev={away.abbrev} />
                      <span className="text-xs font-semibold text-white">{away.abbrev || away.name}</span>
                      {away.rank && <span className="text-[9px] text-slate-500">#{away.rank}</span>}
                      {away.record && <span className="text-[9px] text-slate-500 ml-1">{away.record}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500">Avg. Per Game</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      {home.rank && <span className="text-[9px] text-slate-500">#{home.rank}</span>}
                      <span className="text-xs font-semibold text-white">{home.abbrev || home.name}</span>
                      <TeamLogo logo={home.logo} abbrev={home.abbrev} />
                      {home.record && <span className="text-[9px] text-slate-500">{home.record}</span>}
                    </div>
                  </div>

                  {/* Leaders rows */}
                  <div className="space-y-0 divide-y divide-slate-800/60">
                    {Array.from({ length: leaderCategories }).map((_, i) => {
                      const awayL = away.leaders?.[i];
                      const homeL = home.leaders?.[i];
                      const statLabel = awayL?.primaryStat?.label || homeL?.primaryStat?.label || "";

                      return (
                        <div key={i} className="flex items-center py-3 gap-2">
                          {/* Away player */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Headshot src={awayL?.headshot} name={awayL?.name} />
                            <div className="min-w-0">
                              <p className="text-xs text-white font-medium truncate">
                                {awayL?.name || "—"} {awayL?.jersey ? `#${awayL.jersey}` : ""}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {awayL?.secondaryStats?.map((s) => `${s.value} ${s.label}`).join(", ")}
                              </p>
                            </div>
                          </div>

                          {/* Center stat */}
                          <div className="flex flex-col items-center flex-shrink-0 w-28 text-center">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white">{awayL?.primaryStat?.value || "—"}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{statLabel}</span>
                              <span className="text-base font-bold text-white">{homeL?.primaryStat?.value || "—"}</span>
                            </div>
                          </div>

                          {/* Home player */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                            <div className="min-w-0">
                              <p className="text-xs text-white font-medium truncate">
                                {homeL?.name || "—"} {homeL?.jersey ? `#${homeL.jersey}` : ""}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {homeL?.secondaryStats?.map((s) => `${s.value} ${s.label}`).join(", ")}
                              </p>
                            </div>
                            <Headshot src={homeL?.headshot} name={homeL?.name} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TEAM STATS ── */}
              {hasStats && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3 px-1">
                    Team Stats
                  </div>

                  {/* Team header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo logo={away.logo} abbrev={away.abbrev} />
                      <span className="text-xs font-semibold text-white">{away.abbrev || away.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-semibold text-white">{home.abbrev || home.name}</span>
                      <TeamLogo logo={home.logo} abbrev={home.abbrev} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {mergedStats.map(({ key, label, homeVal, awayVal, homeDisplay, awayDisplay, max }) => {
                      const homeWidth = Math.round((homeVal / max) * 100);
                      const awayWidth = Math.round((awayVal / max) * 100);
                      const homeBetter = homeVal >= awayVal;

                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${!homeBetter ? "text-blue-400" : "text-slate-300"}`}>
                              {awayDisplay}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
                            <span className={`text-xs font-semibold ${homeBetter ? "text-blue-400" : "text-slate-300"}`}>
                              {homeDisplay}
                            </span>
                          </div>
                          <div className="flex gap-1 h-1.5">
                            {/* Away bar — grows left to right */}
                            <div className="flex-1 flex justify-end">
                              <div
                                className={`h-1.5 rounded-full transition-all ${!homeBetter ? "bg-blue-500" : "bg-slate-600"}`}
                                style={{ width: `${awayWidth}%` }}
                              />
                            </div>
                            <div className="w-px bg-slate-700 flex-shrink-0" />
                            {/* Home bar — grows right */}
                            <div className="flex-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${homeBetter ? "bg-blue-500" : "bg-slate-600"}`}
                                style={{ width: `${homeWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-slate-600 text-right">Source: ESPN</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
