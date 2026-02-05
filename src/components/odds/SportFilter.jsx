import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SportFilter({ sports, selectedSport, onSelectSport }) {
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
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSelectSport(sport.id)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedSport === sport.id
                ? "text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
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
            </span>
          </button>
        ))}
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
