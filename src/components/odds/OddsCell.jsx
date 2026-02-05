import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function OddsCell({ odds, point, isBest, type = "moneyline", onClick, isSelected, dataTour }) {
  if (!odds && odds !== 0) {
    return (
      <div className="px-2 py-1.5 text-center text-slate-600 text-sm">
        —
      </div>
    );
  }

  const formatOdds = (value) => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const formatPoint = (value, type) => {
    if (!value && value !== 0) return "";
    if (type === "spread") {
      return value > 0 ? `+${value}` : value.toString();
    }
    return value.toString();
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      disabled={!odds && odds !== 0}
      data-tour={dataTour}
      className={cn(
        "relative px-2 py-1.5 rounded-lg text-center transition-all cursor-pointer hover:scale-105 active:scale-95",
        isSelected
          ? "bg-blue-500/30 border-2 border-blue-500 ring-2 ring-blue-500/50"
          : isBest 
            ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 ring-1 ring-green-500/30" 
            : "hover:bg-slate-800/50",
        (!odds && odds !== 0) && "cursor-not-allowed opacity-50"
      )}
    >
      {isBest && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      <div className="flex flex-col items-center">
        {point !== undefined && point !== null && (
          <span className={cn(
            "text-xs font-medium",
            isBest ? "text-green-400" : "text-slate-400"
          )}>
            {formatPoint(point, type)}
          </span>
        )}
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          isBest ? "text-green-400" : "text-white"
        )}>
          {formatOdds(odds)}
        </span>
      </div>
    </motion.button>
  );
}