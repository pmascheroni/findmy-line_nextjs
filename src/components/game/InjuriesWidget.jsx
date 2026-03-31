import { useState, useEffect, useRef } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, User, ExternalLink, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function InjuriesWidget({ homeTeam, awayTeam, sportKey }) {
  const [injuries, setInjuries] = useState({
    home: { teamName: "", logo: null, injuries: [], injuryNews: [] },
    away: { teamName: "", logo: null, injuries: [], injuryNews: [] },
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const homeTeamName = typeof homeTeam === "string" ? homeTeam : homeTeam?.name;
    const awayTeamName = typeof awayTeam === "string" ? awayTeam : awayTeam?.name;

    if (!sportKey || !homeTeamName || !awayTeamName) {
      setInjuries({
        home: { teamName: homeTeamName || "Home", logo: null, injuries: [], injuryNews: [] },
        away: { teamName: awayTeamName || "Away", logo: null, injuries: [], injuryNews: [] },
      });
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchInjuries = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ sportKey, homeTeam: homeTeamName, awayTeam: awayTeamName });
        const response = await fetch(`/api/espn/injuries?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to fetch injuries");
        if (!isCancelled) {
          setInjuries({
            home: data?.home || { teamName: homeTeamName, logo: null, injuries: [], injuryNews: [] },
            away: data?.away || { teamName: awayTeamName, logo: null, injuries: [], injuryNews: [] },
          });
        }
      } catch {
        if (!isCancelled) {
          setInjuries({
            home: { teamName: homeTeamName, logo: null, injuries: [], injuryNews: [] },
            away: { teamName: awayTeamName, logo: null, injuries: [], injuryNews: [] },
          });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchInjuries();
    return () => { isCancelled = true; };
  }, [homeTeam, awayTeam, sportKey]);

  // Auto-minimize after 16s
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isExpanded) {
      timeoutRef.current = setTimeout(() => setIsExpanded(false), 16000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isExpanded]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("out")) return { dot: "bg-red-500", text: "text-red-400" };
    if (s.includes("doubtful")) return { dot: "bg-orange-500", text: "text-orange-400" };
    if (s.includes("questionable") || s.includes("gtd") || s.includes("day-to-day"))
      return { dot: "bg-yellow-500", text: "text-yellow-400" };
    if (s.includes("probable")) return { dot: "bg-green-500", text: "text-green-400" };
    return { dot: "bg-slate-500", text: "text-slate-400" };
  };

  const formatReturnDate = (dateStr) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), "MMM d"); } catch { return dateStr; }
  };

  const homeCount = injuries.home?.injuries?.length || 0;
  const awayCount = injuries.away?.injuries?.length || 0;
  const homeNewsCount = injuries.home?.injuryNews?.length || 0;
  const awayNewsCount = injuries.away?.injuryNews?.length || 0;
  const totalCount = homeCount + awayCount + homeNewsCount + awayNewsCount;

  const homeTeamName =
    injuries.home?.teamName || (typeof homeTeam === "string" ? homeTeam : homeTeam?.name || "Home");
  const awayTeamName =
    injuries.away?.teamName || (typeof awayTeam === "string" ? awayTeam : awayTeam?.name || "Away");

  const InjuryRow = ({ injury, isOdd }) => {
    const statusColors = getStatusColor(injury.status);
    return (
      <div className={`py-2 px-2 ${isOdd ? "bg-slate-800/30" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {injury.headshot ? (
              <img
                src={injury.headshot}
                alt={injury.name}
                className="w-7 h-7 rounded-full object-cover bg-slate-700 flex-shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-slate-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-medium truncate">{injury.name}</p>
              <p className="text-[10px] text-slate-500">{injury.position}</p>
              {injury.comment && (
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{injury.comment}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
              <span className={`text-xs font-medium ${statusColors.text}`}>{injury.status}</span>
            </div>
            {injury.injuryType && (
              <p className="text-[10px] text-slate-500 max-w-[80px] text-right truncate">{injury.injuryType}</p>
            )}
            {injury.returnDate && (
              <p className="text-[10px] text-slate-400">{formatReturnDate(injury.returnDate)}</p>
            )}
          </div>
        </div>
        {/* Source label */}
        {injury.source && (
          <div className="mt-1 flex items-center justify-end">
            {injury.sourceUrl ? (
              <a
                href={injury.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-[9px] text-blue-500/60 hover:text-blue-400 transition-colors"
              >
                {injury.source}
                <ExternalLink className="w-2 h-2" />
              </a>
            ) : (
              <span className="text-[9px] text-slate-600">{injury.source}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const NewsRow = ({ article, isOdd }) => (
    <div className={`py-2 px-2 ${isOdd ? "bg-slate-800/30" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Newspaper className="w-3 h-3 text-orange-400/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white font-medium line-clamp-2">{article.headline}</p>
          {article.description && (
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{article.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {article.published && (
              <span className="text-[9px] text-slate-600">{article.published}</span>
            )}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 text-[9px] text-blue-500/60 hover:text-blue-400 transition-colors ml-auto"
            >
              Via ESPN
              <ExternalLink className="w-2 h-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const TeamInjurySection = ({ teamData }) => {
    const hasOfficial = teamData.injuries?.length > 0;
    const hasNews = teamData.injuryNews?.length > 0;
    const hasAny = hasOfficial || hasNews;

    return (
      <div className="h-full">
        <div className="flex items-center gap-2 mb-2 px-2">
          {teamData.logo && (
            <img src={teamData.logo} alt="" className="w-5 h-5 object-contain" />
          )}
          <h4 className="text-xs font-semibold text-white truncate">{teamData.teamName}</h4>
        </div>

        {!hasAny ? (
          <p className="text-xs text-slate-600 px-2 py-2">No injury reports found</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Official injuries */}
            {hasOfficial && (
              <>
                <div className="px-2 py-1 border-b border-slate-700/50">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                    Official · ESPN
                  </span>
                </div>
                {teamData.injuries.map((injury, idx) => (
                  <InjuryRow key={idx} injury={injury} isOdd={idx % 2 === 1} />
                ))}
              </>
            )}

            {/* News-based injury reports */}
            {hasNews && (
              <>
                <div className={`px-2 py-1 border-b border-slate-700/50 ${hasOfficial ? "mt-2 border-t border-slate-700/30" : ""}`}>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                    News · ESPN
                  </span>
                </div>
                {teamData.injuryNews.map((article, idx) => (
                  <NewsRow key={idx} article={article} isOdd={idx % 2 === 1} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-4 mb-6 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              <span className="text-orange-400">INJURY</span> REPORT
            </h3>
            {!isExpanded && !loading && (
              <p className="text-xs text-slate-400">
                <span className="text-orange-400 font-semibold">{awayCount + awayNewsCount}</span>{" "}
                {awayTeamName.split(" ").pop()} ·{" "}
                <span className="text-orange-400 font-semibold">{homeCount + homeNewsCount}</span>{" "}
                {homeTeamName.split(" ").pop()}
              </p>
            )}
            {loading && <p className="text-xs text-slate-500">Loading...</p>}
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {!isExpanded && !loading && totalCount === 0 && (
        <p className="text-xs text-slate-500 mt-1">No injury reports found</p>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border-r border-slate-700/50 pr-4">
                <TeamInjurySection teamData={injuries.away} />
              </div>
              <div>
                <TeamInjurySection teamData={injuries.home} />
              </div>
            </div>
            <p className="text-[9px] text-slate-600 mt-3 text-right">
              Sources: ESPN Official API · ESPN News
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
