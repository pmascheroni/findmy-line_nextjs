"use client";

import { useState } from "react";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useBetSlip } from "@/components/game/BetSlipContext";

const SPORTSBOOK_URLS = {
  "DraftKings": "https://sportsbook.draftkings.com",
  "FanDuel": "https://sportsbook.fanduel.com",
  "BetMGM": "https://sports.betmgm.com",
  "Caesars": "https://www.caesars.com/sportsbook-and-casino",
  "ESPN BET": "https://espnbet.com"
};

export default function BetCheckout() {
  const { bets, removeBet, clearBets } = useBetSlip();

  const calculatePayout = (odds, stake = 100) => {
    if (odds > 0) {
      return stake + (stake * (odds / 100));
    } else {
      return stake + (stake / (Math.abs(odds) / 100));
    }
  };

  const groupedBets = bets.reduce((acc, bet) => {
    if (!acc[bet.sportsbook]) {
      acc[bet.sportsbook] = [];
    }
    acc[bet.sportsbook].push(bet);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={createPageUrl("Home")}>
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">Bet Checkout</h1>
          <p className="text-slate-400 mt-1">Review and place your bets</p>
        </div>
        {bets.length > 0 && (
          <Button
            onClick={clearBets}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Bets List */}
      {bets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-slate-400 mb-2">No bets selected</p>
          <p className="text-slate-500 text-sm mb-4">Click on odds in any game to add bets</p>
          <Link href={createPageUrl("Home")}>
            <Button className="bg-blue-500 hover:bg-blue-600">
              Browse Games
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBets).map(([sportsbook, sportsbookBets]) => (
            <motion.div
              key={sportsbook}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden"
            >
              {/* Sportsbook Header */}
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{sportsbook}</h2>
                    <p className="text-sm text-slate-400">{sportsbookBets.length} bet{sportsbookBets.length > 1 ? 's' : ''}</p>
                  </div>
                  <a
                    href={SPORTSBOOK_URLS[sportsbook]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Place Bets
                    </Button>
                  </a>
                </div>
              </div>

              {/* Bets */}
              <div className="divide-y divide-slate-800/50">
                <AnimatePresence>
                  {sportsbookBets.map((bet, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-slate-500">{bet.marketName}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-sm text-slate-500">{bet.awayTeam} @ {bet.homeTeam}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-white">
                              {bet.outcome}
                            </span>
                            {bet.point !== undefined && (
                              <span className="text-sm text-slate-400">
                                ({bet.point > 0 ? '+' : ''}{bet.point})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm text-blue-400 font-medium">
                              {bet.odds > 0 ? '+' : ''}{bet.odds}
                            </span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-sm text-green-400">
                              $100 → ${calculatePayout(bet.odds, 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeBet(
                            bet.gameId,
                            bet.market,
                            bet.outcome,
                            bet.sportsbook,
                            bet.point
                          )}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {bets.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-xs text-amber-400">
            <strong>Note:</strong> You'll be redirected to the sportsbook's website to complete your bets. Make sure you have an account with the sportsbook before proceeding.
          </p>
        </div>
      )}
    </div>
  );
}
