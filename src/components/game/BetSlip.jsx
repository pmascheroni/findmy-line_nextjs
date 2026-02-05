import { X, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBetSlip } from "./BetSlipContext";
import { motion, AnimatePresence } from "framer-motion";

export default function BetSlip() {
  const { bets, removeBet, clearBets } = useBetSlip();

  if (bets.length === 0) return null;

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="fixed right-4 top-24 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 max-h-[calc(100vh-7rem)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Bet Slip</h3>
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
            {bets.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearBets}
          className="text-slate-400 hover:text-white"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Bets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {bets.map((bet, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    {bet.outcome}
                    {bet.point !== undefined && (
                      <span className="text-slate-400 ml-1">
                        ({bet.point > 0 ? '+' : ''}{bet.point})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {bet.marketName} • {bet.awayTeam} @ {bet.homeTeam}
                  </div>
                </div>
                <button
                  onClick={() => removeBet(bet)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{bet.sportsbook}</span>
                <span className={`text-sm font-bold ${
                  bet.odds > 0 ? 'text-green-400' : 'text-slate-300'
                }`}>
                  {bet.odds > 0 ? '+' : ''}{bet.odds}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}