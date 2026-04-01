import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { SPORT_GROUPS, EXTRA_SPORTS } from "@/lib/sportsCatalog";

export default function SportFilter({ sports, selectedSport, onSelectSport, sportsWithGamesToday = [], onSportWithoutGamesClick, expandedGroups = {}, onToggleGroup }) {
  const scrollerRef = useRef(null);

  const scrollBy = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  // Build a map of sport id to full sport object for expanded groups
  const sportDetailsMap = EXTRA_SPORTS.reduce((acc, sport) => {
    acc[sport.id] = sport;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scrollbar-none py-1"
        >
          {sports.map((sport) => {
            const hasGamesToday = sportsWithGamesToday.includes(sport.id);
            const isDimmed = !hasGamesToday && sport.id !== 'all';
            const isGrouped = sport.isGroup === true;
            const isExpanded = expandedGroups[sport.id] === true;
            
            const handleClick = () => {
              if (isGrouped && onToggleGroup) {
                onToggleGroup(sport.id);
              } else if (!hasGamesToday && sport.id !== 'all' && onSportWithoutGamesClick) {
                onSportWithoutGamesClick(sport);
              } else {
                onSelectSport(sport.id);
              }
            };
            
            return (
              <button
                key={sport.id}
                onClick={handleClick}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedSport === sport.id
                    ? "text-white"
                    : isDimmed 
                      ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                } ${isDimmed ? 'opacity-70' : ''}`}
                title={isDimmed ? `No games today - will navigate to next available date` : undefined}
              >
                {selectedSport === sport.id && !isGrouped && (
                  <motion.div
                    layoutId="sportFilter"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <span>{sport.icon}</span>
                  <span className="hidden sm:inline">{sport.name}</span>
                  {isDimmed && <span className="text-xs ml-1">⏱️</span>}
                  {isGrouped && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.div>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded group sports */}
      <AnimatePresence>
        {Object.entries(expandedGroups).map(([groupId, isExpanded]) => {
          if (!isExpanded) return null;
          const group = SPORT_GROUPS[groupId];
          if (!group) return null;
          
          return (
            <motion.div
              key={`group-${groupId}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 px-2 border-l-2 border-blue-500/50 ml-2"
              >
              {group.sports.map((sportId) => {
                const sportDetail = sportDetailsMap[sportId];
                if (!sportDetail) return null;
                
                const hasGamesToday = sportsWithGamesToday.includes(sportId);
                const isDimmed = !hasGamesToday;
                
                const handleClick = () => {
                  if (!hasGamesToday && onSportWithoutGamesClick) {
                    onSportWithoutGamesClick(sportDetail);
                  } else {
                    onSelectSport(sportId);
                  }
                };
                
                return (
                  <button
                    key={sportId}
                    onClick={handleClick}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      selectedSport === sportId
                        ? "text-white"
                        : isDimmed 
                          ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    } ${isDimmed ? 'opacity-70' : ''}`}
                    title={isDimmed ? `No games today - will navigate to next available date` : undefined}
                  >
                    {selectedSport === sportId && (
                      <motion.div
                        layoutId="sportFilter"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <span>{sportDetail.icon}</span>
                      <span className="hidden sm:inline">{sportDetail.name}</span>
                      {isDimmed && <span className="text-xs ml-1">⏱️</span>}
                    </span>
                  </button>
                );
              })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
