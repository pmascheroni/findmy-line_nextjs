import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLeaguesForSportGroup } from "@/lib/sportsCatalog";

export default function LeagueFilter({
  sportGroupId,
  selectedLeagues = [],
  onSelectLeague,
  sportsWithGamesToday = [],
  upcomingLeaguesByDay = {}, // { leagueId: { date: "2026-04-02", display: "Thu" } }
}) {
  const scrollerRef = useRef(null);

  // Only show league filter if a specific sport is selected (not "all")
  if (!sportGroupId || sportGroupId === "all") {
    return null;
  }

  const scrollBy = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  const leagues = getLeaguesForSportGroup(sportGroupId);
  if (!leagues || leagues.length === 0) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`league-filter-${sportGroupId}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full border-t border-slate-800/50 pt-2"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Leagues</div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <div
              ref={scrollerRef}
              className="flex gap-2 overflow-x-auto scrollbar-none py-1 flex-1"
            >
              {leagues.map((league) => {
                const hasGameToday = sportsWithGamesToday.includes(league.id);
                const upcomingInfo = upcomingLeaguesByDay[league.id];
                const isUpcoming = !hasGameToday && upcomingInfo;
                const isDimmed = !hasGameToday && !upcomingInfo;

                const handleClick = () => {
                  if (isUpcoming && upcomingInfo?.date) {
                    // TODO: Trigger date change to upcomingInfo.date
                    onSelectLeague(league.id, upcomingInfo.date);
                  } else if (hasGameToday) {
                    onSelectLeague(league.id);
                  }
                };

                return (
                  <button
                    key={league.id}
                    onClick={handleClick}
                    disabled={isDimmed}
                    className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      hasGameToday
                        ? "text-white bg-slate-800/60 hover:bg-slate-700/60 cursor-pointer"
                        : isUpcoming
                          ? "text-slate-400 bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer border border-slate-800/50"
                          : "text-slate-600 bg-slate-950/50 cursor-not-allowed opacity-50"
                    }`}
                    title={
                      isUpcoming
                        ? `Games ${upcomingInfo.display} - click to jump`
                        : hasGameToday
                          ? `Games today`
                          : "No games this week"
                    }
                  >
                    <span className="relative flex items-center gap-1">
                      <span>{league.icon}</span>
                      <span className="hidden sm:inline">{league.name}</span>
                      {isUpcoming && (
                        <span className="text-xs text-slate-500 ml-0.5">
                          {upcomingInfo.display}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
