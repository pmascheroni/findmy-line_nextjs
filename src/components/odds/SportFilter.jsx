import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SportFilter({ sports, selectedSport, onSelectSport, sportsWithGamesToday = [], onSportWithoutGamesClick }) {
  const scrollerRef = useRef(null);

  const scrollBy = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  return (
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
          
          const handleClick = () => {
            if (!hasGamesToday && sport.id !== 'all' && onSportWithoutGamesClick) {
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
              {selectedSport === sport.id && (
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
  );
}
