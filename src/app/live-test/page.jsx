"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Simulated ESPN-style game data for testing
const MOCK_GAMES = {
  nba_live: {
    id: "test-nba-live",
    sport_key: "basketball_nba",
    sport_title: "NBA",
    home_team: "Los Angeles Lakers",
    away_team: "Boston Celtics",
    commence_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Started 1 hour ago
    bookmakers: [
      {
        key: "draftkings",
        title: "DraftKings",
        markets: [
          { key: "h2h", outcomes: [{ name: "Boston Celtics", price: -150 }, { name: "Los Angeles Lakers", price: 130 }] },
          { key: "spreads", outcomes: [{ name: "Boston Celtics", price: -110, point: -3.5 }, { name: "Los Angeles Lakers", price: -110, point: 3.5 }] },
          { key: "totals", outcomes: [{ name: "Over", price: -110, point: 224.5 }, { name: "Under", price: -110, point: 224.5 }] }
        ]
      },
      {
        key: "fanduel",
        title: "FanDuel",
        markets: [
          { key: "h2h", outcomes: [{ name: "Boston Celtics", price: -145 }, { name: "Los Angeles Lakers", price: 125 }] },
          { key: "spreads", outcomes: [{ name: "Boston Celtics", price: -108, point: -3.5 }, { name: "Los Angeles Lakers", price: -112, point: 3.5 }] },
          { key: "totals", outcomes: [{ name: "Over", price: -108, point: 224.5 }, { name: "Under", price: -112, point: 224.5 }] }
        ]
      }
    ],
    // Mock live data that would come from ESPN
    _mockLiveData: {
      homeScore: "58",
      awayScore: "62",
      status: "3rd Qtr",
      shortStatus: "5:42 - 3rd",
      period: 3,
      clock: "5:42",
      isLive: true,
      isComplete: false,
      homeLinescores: [28, 22, 8],
      awayLinescores: [30, 20, 12],
      homeAbbr: "LAL",
      awayAbbr: "BOS",
      homeTimeouts: 4,
      awayTimeouts: 3,
      possession: "Los Angeles Lakers"
    }
  },
  nfl_live: {
    id: "test-nfl-live",
    sport_key: "americanfootball_nfl",
    sport_title: "NFL",
    home_team: "Kansas City Chiefs",
    away_team: "Buffalo Bills",
    commence_time: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // Started 1.5 hours ago
    bookmakers: [
      {
        key: "draftkings",
        title: "DraftKings",
        markets: [
          { key: "h2h", outcomes: [{ name: "Buffalo Bills", price: 140 }, { name: "Kansas City Chiefs", price: -160 }] },
          { key: "spreads", outcomes: [{ name: "Buffalo Bills", price: -110, point: 3.5 }, { name: "Kansas City Chiefs", price: -110, point: -3.5 }] },
          { key: "totals", outcomes: [{ name: "Over", price: -110, point: 48.5 }, { name: "Under", price: -110, point: 48.5 }] }
        ]
      },
      {
        key: "fanduel",
        title: "FanDuel",
        markets: [
          { key: "h2h", outcomes: [{ name: "Buffalo Bills", price: 135 }, { name: "Kansas City Chiefs", price: -155 }] },
          { key: "spreads", outcomes: [{ name: "Buffalo Bills", price: -105, point: 3.5 }, { name: "Kansas City Chiefs", price: -115, point: -3.5 }] },
          { key: "totals", outcomes: [{ name: "Over", price: -105, point: 48.5 }, { name: "Under", price: -115, point: 48.5 }] }
        ]
      }
    ],
    _mockLiveData: {
      homeScore: "21",
      awayScore: "17",
      status: "3rd Quarter",
      shortStatus: "8:23 - 3rd",
      period: 3,
      clock: "8:23",
      isLive: true,
      isComplete: false,
      homeLinescores: [7, 14, 0],
      awayLinescores: [10, 7, 0],
      homeAbbr: "KC",
      awayAbbr: "BUF",
      homeTimeouts: 2,
      awayTimeouts: 3,
      possession: "Kansas City Chiefs",
      lastPlay: "P.Mahomes pass complete to T.Kelce for 15 yards to the BUF 42."
    }
  },
  ncaab_live: {
    id: "test-ncaab-live",
    sport_key: "basketball_ncaab",
    sport_title: "NCAAB",
    home_team: "Duke Blue Devils",
    away_team: "North Carolina Tar Heels",
    commence_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    bookmakers: [
      {
        key: "draftkings",
        title: "DraftKings",
        markets: [
          { key: "h2h", outcomes: [{ name: "North Carolina Tar Heels", price: 165 }, { name: "Duke Blue Devils", price: -190 }] },
          { key: "spreads", outcomes: [{ name: "North Carolina Tar Heels", price: -110, point: 5.5 }, { name: "Duke Blue Devils", price: -110, point: -5.5 }] },
          { key: "totals", outcomes: [{ name: "Over", price: -110, point: 152.5 }, { name: "Under", price: -110, point: 152.5 }] }
        ]
      }
    ],
    _mockLiveData: {
      homeScore: "42",
      awayScore: "38",
      status: "2nd Half",
      shortStatus: "12:15 - 2nd",
      period: 2,
      clock: "12:15",
      isLive: true,
      isComplete: false,
      homeLinescores: [35, 7],
      awayLinescores: [32, 6],
      homeAbbr: "DUKE",
      awayAbbr: "UNC",
      homeTimeouts: 3,
      awayTimeouts: 2,
      possession: "Duke Blue Devils"
    }
  },
  nba_final: {
    id: "test-nba-final",
    sport_key: "basketball_nba",
    sport_title: "NBA",
    home_team: "Golden State Warriors",
    away_team: "Denver Nuggets",
    commence_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    bookmakers: [
      {
        key: "draftkings",
        title: "DraftKings",
        markets: [
          { key: "h2h", outcomes: [{ name: "Denver Nuggets", price: -130 }, { name: "Golden State Warriors", price: 110 }] },
          { key: "spreads", outcomes: [{ name: "Denver Nuggets", price: -110, point: -2.5 }, { name: "Golden State Warriors", price: -110, point: 2.5 }] }
        ]
      }
    ],
    _mockLiveData: {
      homeScore: "118",
      awayScore: "124",
      status: "Final",
      shortStatus: "Final",
      period: 4,
      clock: "0:00",
      isLive: false,
      isComplete: true,
      homeLinescores: [28, 32, 30, 28],
      awayLinescores: [30, 28, 34, 32],
      homeAbbr: "GSW",
      awayAbbr: "DEN"
    }
  }
};

export default function LiveTest() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState("nba_live");
  
  const handleTestGame = () => {
    const game = MOCK_GAMES[selectedGame];
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`game_${game.id}`, JSON.stringify(game));
      window.sessionStorage.setItem(`mock_live_${game.id}`, JSON.stringify(game._mockLiveData));
    }
    router.push(`/game/${game.id}?sport=${game.sport_key}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Live Game Display Test</h1>
        <p className="text-slate-400 mb-6">
          Test how live games appear with simulated ESPN data including scores, timeouts, possession, and period breakdowns.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Select Test Scenario</label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nba_live">🏀 NBA Live - Lakers vs Celtics (3rd Qtr)</SelectItem>
                <SelectItem value="nfl_live">🏈 NFL Live - Chiefs vs Bills (3rd Qtr)</SelectItem>
                <SelectItem value="ncaab_live">🏀 NCAAB Live - Duke vs UNC (2nd Half)</SelectItem>
                <SelectItem value="nba_final">🏀 NBA Final - Warriors vs Nuggets</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Preview of selected game */}
          <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Preview Data:</h3>
            {(() => {
              const game = MOCK_GAMES[selectedGame];
              const live = game._mockLiveData;
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Matchup:</span>
                    <span className="text-white">{game.away_team} @ {game.home_team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Score:</span>
                    <span className="text-white">{live.awayScore} - {live.homeScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className={live.isLive ? "text-red-400" : "text-slate-300"}>{live.shortStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period Scores:</span>
                    <span className="text-white">
                      {live.awayAbbr}: {live.awayLinescores.join('-')} | {live.homeAbbr}: {live.homeLinescores.join('-')}
                    </span>
                  </div>
                  {live.homeTimeouts !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timeouts:</span>
                      <span className="text-white">{live.awayAbbr}: {live.awayTimeouts} | {live.homeAbbr}: {live.homeTimeouts}</span>
                    </div>
                  )}
                  {live.possession && live.isLive && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Possession:</span>
                      <span className="text-yellow-400">{live.possession}</span>
                    </div>
                  )}
                  {live.lastPlay && (
                    <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400">
                      <span className="text-slate-500">Last Play:</span> {live.lastPlay}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          
          <Button 
            onClick={handleTestGame}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            View Live Game Detail Page →
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-800/30 rounded-lg p-4 text-sm text-slate-500">
        <p><strong>Note:</strong> This test page passes mock ESPN data to the GameDetail page to simulate what a live game would look like. The actual GameDetail page fetches real data from ESPN's API.</p>
      </div>
    </div>
  );
}
