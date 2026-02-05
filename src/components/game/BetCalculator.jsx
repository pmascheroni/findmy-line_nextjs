import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, DollarSign, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetSlip } from "./BetSlipContext";

const SPORTSBOOK_URLS = {
  // Sportsbooks
  "DraftKings": "https://sportsbook.draftkings.com",
  "draftkings": "https://sportsbook.draftkings.com",
  "FanDuel": "https://sportsbook.fanduel.com",
  "fanduel": "https://sportsbook.fanduel.com",
  "BetMGM": "https://sports.betmgm.com",
  "betmgm": "https://sports.betmgm.com",
  "Caesars": "https://sportsbook.caesars.com",
  "williamhill_us": "https://sportsbook.caesars.com",
  "ESPN BET": "https://espnbet.com",
  "espnbet": "https://espnbet.com",
  // Prediction Markets
  "Polymarket": "https://polymarket.com",
  "polymarket": "https://polymarket.com",
  "Kalshi": "https://kalshi.com",
  "kalshi": "https://kalshi.com",
  "PredictIt": "https://www.predictit.org",
  "predictit": "https://www.predictit.org",
  "Robinhood": "https://robinhood.com/markets",
  "robinhood": "https://robinhood.com/markets",
};

export default function BetCalculator() {
  const { bets } = useBetSlip();
  const [betAmount, setBetAmount] = useState(100);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-minimize after 3 seconds of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    };

    if (isExpanded) {
      resetTimer();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isExpanded]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const calculatePayout = (odds, stake) => {
    if (odds > 0) {
      return stake + (stake * (odds / 100));
    } else {
      return stake + (stake / (Math.abs(odds) / 100));
    }
  };

  const handleKeypadClick = (value) => {
    if (value === "clear") {
      setBetAmount(0);
    } else if (value === "backspace") {
      setBetAmount(Math.floor(betAmount / 10));
    } else {
      const newAmount = betAmount * 10 + value;
      if (newAmount <= 999999) {
        setBetAmount(newAmount);
      }
    }
  };

  const commonAmounts = [25, 50, 100, 250, 500, 1000];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-4 mb-6 cursor-pointer"
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Bet Calculator</h3>
            {!isExpanded && (
              <p className="text-xs text-slate-400">Wager: <span className="text-green-400 font-semibold">${betAmount}</span></p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Minimized View - Show payouts summary */}
      {!isExpanded && (
        <div className="text-xs text-slate-400 mt-2">
          {bets.length > 0 ? (
            <div className="space-y-1">
              {bets.map((bet, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="truncate flex-1 mr-2">
                    {bet.outcome} {bet.point !== undefined ? `(${bet.point > 0 ? '+' : ''}${bet.point})` : ''} · {bet.odds > 0 ? '+' : ''}{bet.odds}
                  </span>
                  <span className="text-green-400 font-semibold">
                    ${calculatePayout(bet.odds, betAmount).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 mt-1">
                <span>Total payout</span>
                <span className="text-green-400 font-semibold">
                  ${bets.reduce((sum, bet) => sum + calculatePayout(bet.odds, betAmount), 0).toFixed(2)}
                </span>
              </div>
              {/* Checkout buttons for minimized view */}
              <div className="flex flex-wrap gap-1 pt-2 mt-1 border-t border-slate-700/50">
                {[...new Set(bets.map(b => b.sportsbook))].map(book => (
                  <a
                    key={book}
                    href={SPORTSBOOK_URLS[book] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors"
                  >
                    {book} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <span>Click to expand</span>
          )}
        </div>
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
            <div className="space-y-4 mt-2">
        {/* Bet Amount Input */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Bet Amount</label>
          <Dialog open={showKeypad} onOpenChange={setShowKeypad}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <Input
                  type="text"
                  value={betAmount}
                  readOnly
                  className="pl-8 bg-slate-800 border-slate-700 text-white text-lg font-semibold cursor-pointer hover:bg-slate-750"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-xs">
              <DialogHeader>
                <DialogTitle className="text-white">Enter Bet Amount</DialogTitle>
              </DialogHeader>
              
              {/* Display */}
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <div className="text-3xl font-bold text-white text-right">
                  ${betAmount.toLocaleString()}
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleKeypadClick(num)}
                    variant="outline"
                    className="h-14 text-lg font-semibold bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  onClick={() => handleKeypadClick("clear")}
                  variant="outline"
                  className="h-14 text-sm font-semibold bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => handleKeypadClick(0)}
                  variant="outline"
                  className="h-14 text-lg font-semibold bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                >
                  0
                </Button>
                <Button
                  onClick={() => handleKeypadClick("backspace")}
                  variant="outline"
                  className="h-14 text-sm font-semibold bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                >
                  ⌫
                </Button>
              </div>

              <Button
                onClick={() => setShowKeypad(false)}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Done
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {commonAmounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => setBetAmount(amount)}
              variant="outline"
              size="sm"
              className={`text-xs ${
                betAmount === amount
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              ${amount}
            </Button>
          ))}
        </div>

        {/* Potential Payouts */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">
            {bets.length > 0 ? "Selected Bets Payout" : "Example Payouts"}
          </p>
          {bets.length > 0 ? (
            <div className="space-y-2">
              <div className="max-h-32 overflow-y-auto space-y-2">
                {bets.map((bet, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 truncate">
                        {bet.outcome} {bet.point !== undefined ? `(${bet.point > 0 ? '+' : ''}${bet.point})` : ''}
                      </p>
                      <p className="text-xs text-slate-500">{bet.odds > 0 ? '+' : ''}{bet.odds} · {bet.sportsbook}</p>
                    </div>
                    <p className="text-sm font-semibold text-green-400 ml-2">
                      ${calculatePayout(bet.odds, betAmount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              {/* Checkout buttons for expanded view */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50" data-tour="place-bet-button">
                {[...new Set(bets.map(b => b.sportsbook))].map(book => (
                  <a
                    key={book}
                    href={SPORTSBOOK_URLS[book] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Place bet on {book} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">+150 Odds</p>
                <p className="text-sm font-semibold text-green-400">
                  ${calculatePayout(150, betAmount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">-150 Odds</p>
                <p className="text-sm font-semibold text-green-400">
                  ${calculatePayout(-150, betAmount).toFixed(2)}
                </p>
              </div>
            </div>
          )}
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}