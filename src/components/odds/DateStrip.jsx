import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";

export default function DateStrip({ selectedDate, onDateChange, datesWithGames = [] }) {
  const scrollerRef = useRef(null);

  // Generate date range: 3 days back, today/selected, 7 days forward
  const baseDate = selectedDate || new Date();
  const startDate = subDays(baseDate, 3);
  const endDate = addDays(baseDate, 7);

  // Generate array of dates
  const dates = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  const scrollBy = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 120, behavior: "smooth" });
  };

  const hasGamesOnDate = (date) => {
    return datesWithGames.some((d) => isSameDay(new Date(d), date));
  };

  return (
    <div className="w-full bg-slate-900/50 border-b border-slate-800/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40">
      <div className="flex items-center gap-2 max-w-full">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Date pills */}
        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scrollbar-none py-1 flex-1"
        >
          {dates.map((date, idx) => {
            const selected = isSameDay(date, baseDate);
            const hasGames = hasGamesOnDate(date);
            const today = isToday(date);

            let label = "";
            if (today) {
              label = "Today";
            } else {
              const dayName = format(date, "EEE").substring(0, 3);
              label = `${dayName} ${format(date, "d")}`;
            }

            return (
              <button
                key={idx}
                onClick={() => onDateChange(date)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selected
                    ? "text-white"
                    : !hasGames
                      ? "text-slate-500 opacity-50 cursor-default"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
                disabled={!hasGames && !selected}
                title={hasGames ? label : `${label} - no games`}
              >
                {selected && (
                  <motion.div
                    layoutId="dateStripSelected"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative">
                  {label}
                  {!hasGames && !selected && <span className="ml-1">⏱️</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
