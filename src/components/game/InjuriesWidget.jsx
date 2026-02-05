import { useState, useEffect, useRef } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function InjuriesWidget({ homeTeam, awayTeam, sportKey }) {
  const [injuries, setInjuries] = useState({ 
    home: { teamName: '', logo: null, injuries: [] }, 
    away: { teamName: '', logo: null, injuries: [] } 
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setLoading(false);
  }, [homeTeam, awayTeam, sportKey]);

  // Auto-minimize after 16 seconds of inactivity
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isExpanded) {
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 16000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isExpanded]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('out')) return { dot: 'bg-red-500', text: 'text-red-400' };
    if (s.includes('doubtful')) return { dot: 'bg-orange-500', text: 'text-orange-400' };
    if (s.includes('questionable') || s.includes('gtd') || s.includes('day-to-day')) return { dot: 'bg-yellow-500', text: 'text-yellow-400' };
    if (s.includes('probable')) return { dot: 'bg-green-500', text: 'text-green-400' };
    return { dot: 'bg-slate-500', text: 'text-slate-400' };
  };

  const formatReturnDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const homeCount = injuries.home?.injuries?.length || 0;
  const awayCount = injuries.away?.injuries?.length || 0;
  const totalCount = homeCount + awayCount;

  const homeTeamName = injuries.home?.teamName || (typeof homeTeam === 'string' ? homeTeam : homeTeam?.name || 'Home');
  const awayTeamName = injuries.away?.teamName || (typeof awayTeam === 'string' ? awayTeam : awayTeam?.name || 'Away');

  const InjuryRow = ({ injury, isOdd, isCompact }) => {
    const statusColors = getStatusColor(injury.status);
    return (
      <div className={`flex items-center justify-between py-1.5 px-2 ${isOdd ? 'bg-slate-800/30' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {injury.headshot ? (
            <img 
              src={injury.headshot} 
              alt={injury.name}
              className="w-7 h-7 rounded-full object-cover bg-slate-700 flex-shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-slate-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">{injury.name}</p>
            <p className="text-[10px] text-slate-500">{injury.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right flex-shrink-0">
          <div>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
              <span className={`text-xs font-medium ${statusColors.text}`}>{injury.status}</span>
            </div>
            {injury.injuryType && (
              <p className="text-[10px] text-slate-500 truncate max-w-[60px]">{injury.injuryType}</p>
            )}
          </div>
          <div className="w-12 text-right hidden sm:block">
            {injury.returnDate && (
              <p className="text-[10px] text-slate-400">{formatReturnDate(injury.returnDate)}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TeamInjurySection = ({ teamData, isCompact }) => (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-2 px-2">
        {teamData.logo && (
          <img src={teamData.logo} alt="" className="w-5 h-5 object-contain" />
        )}
        <h4 className="text-xs font-semibold text-white truncate">{teamData.teamName}</h4>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-700/50 text-[10px] text-slate-500 uppercase tracking-wider">
        <span>Name</span>
        <div className="flex items-center gap-2">
          <span>Status</span>
          <span className="w-12 text-right hidden sm:block">Return</span>
        </div>
      </div>
      
      {/* Injuries */}
      <div className="max-h-48 overflow-y-auto">
        {teamData.injuries?.length === 0 ? (
          <p className="text-xs text-slate-600 px-2 py-2">No injuries reported</p>
        ) : (
          teamData.injuries?.map((injury, idx) => (
            <InjuryRow key={idx} injury={injury} isOdd={idx % 2 === 1} isCompact={isCompact} />
          ))
        )}
      </div>
    </div>
  );

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
                <span className="text-orange-400 font-semibold">{awayCount}</span> {awayTeamName.split(' ').pop()} · <span className="text-orange-400 font-semibold">{homeCount}</span> {homeTeamName.split(' ').pop()}
              </p>
            )}
            {loading && <p className="text-xs text-slate-500">Loading...</p>}
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Minimized summary */}
      {!isExpanded && !loading && totalCount === 0 && (
        <p className="text-xs text-slate-500 mt-1">No reported injuries</p>
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
              {/* Away Team - Left Side */}
              <div className="border-r border-slate-700/50 pr-4">
                <TeamInjurySection teamData={injuries.away} isCompact />
              </div>
              {/* Home Team - Right Side */}
              <div>
                <TeamInjurySection teamData={injuries.home} isCompact />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
