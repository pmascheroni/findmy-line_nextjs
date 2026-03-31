"use client";

import { useState, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import GameCard from "./GameCard";

/**
 * A slim matchup row for ESPN events that don't have Odds API data.
 */
function MatchupRow({ event }) {
  const gameTime = event.date ? new Date(event.date) : null;
  const timeLabel = gameTime
    ? gameTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  const hasTeams = event.homeTeam || event.awayTeam;

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          {hasTeams ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {event.awayLogo && (
                  <img src={event.awayLogo} alt={event.awayAbbrev || ""} className="w-5 h-5 object-contain" />
                )}
                <span className="text-sm text-white font-medium">{event.awayTeam || "Away"}</span>
                {event.awayAbbrev && (
                  <span className="text-xs text-slate-500">({event.awayAbbrev})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {event.homeLogo && (
                  <img src={event.homeLogo} alt={event.homeAbbrev || ""} className="w-5 h-5 object-contain" />
                )}
                <span className="text-sm text-white font-medium">{event.homeTeam || "Home"}</span>
                {event.homeAbbrev && (
                  <span className="text-xs text-slate-500">({event.homeAbbrev})</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-white font-medium">{event.name}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {timeLabel && (
            <span className="text-xs text-slate-400">{timeLabel}</span>
          )}
          {event.status && event.status !== "Scheduled" && (
            <span className="text-xs text-slate-400">{event.status}</span>
          )}
          <span className="text-xs text-slate-600 italic">Odds TBD</span>
        </div>
      </div>
      {event.venue && (
        <div className="mt-1 text-xs text-slate-600">{event.venue}</div>
      )}
    </div>
  );
}

/**
 * DateSectionHeader renders "Today · April 5 · 3 games"
 */
function DateSectionHeader({ label, displayDate, count }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-sm font-semibold text-white">{label}</span>
      <span className="text-slate-600">·</span>
      <span className="text-sm text-slate-400">{displayDate}</span>
      <span className="text-slate-600">·</span>
      <span className="text-sm text-slate-500">{count} {count === 1 ? "game" : "games"}</span>
    </div>
  );
}

/**
 * MultiDaySportFeed
 * Props:
 *   category      - sport catalog entry (id, name, icon, etc.)
 *   initialDays   - array of { date, espnDate, label, displayDate, events: [...] }
 *   oddsGames     - array of odds API games (for matching)
 *   onLoadMore    - callback(lastDate, days) -> Promise<{ days: [...] }>
 */
export default function MultiDaySportFeed({ category, initialDays, oddsGames = [], onLoadMore }) {
  const [days, setDays] = useState(initialDays || []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMoreDays, setNoMoreDays] = useState(false);
  // Track the next start date as the day after the last loaded day
  const [nextStartDate, setNextStartDate] = useState(() => {
    if (!initialDays || initialDays.length === 0) return null;
    // The last day's espnDate + 1 — we'll compute in onLoadMore
    return null;
  });

  // Build odds lookup by team names (normalized)
  const normalize = useCallback((val = "") =>
    String(val || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), []);

  const buildOddsMap = useCallback(() => {
    const map = new Map();
    (oddsGames || []).forEach((game) => {
      if (game.home_team) map.set(normalize(game.home_team), game);
      if (game.away_team) map.set(normalize(game.away_team), game);
      if (game.home_team && game.away_team) {
        map.set(normalize(`${game.away_team} at ${game.home_team}`), game);
        map.set(normalize(`${game.away_team} vs ${game.home_team}`), game);
      }
    });
    return map;
  }, [oddsGames, normalize]);

  const findOddsForEvent = useCallback((event, oddsMap) => {
    if (!oddsMap) return null;
    const keys = [
      event.homeTeam,
      event.awayTeam,
      event.homeTeam && event.awayTeam
        ? `${event.awayTeam} at ${event.homeTeam}`
        : null,
    ]
      .filter(Boolean)
      .map(normalize);
    for (const key of keys) {
      const match = oddsMap.get(key);
      if (match) return match;
    }
    return null;
  }, [normalize]);

  const handleLoadMore = async () => {
    if (!onLoadMore || loadingMore) return;
    setLoadingMore(true);
    try {
      // Compute next start date: last loaded day + 1
      const lastDay = days[days.length - 1];
      const result = await onLoadMore(lastDay?.espnDate);
      if (!result?.days || result.days.length === 0) {
        setNoMoreDays(true);
      } else {
        setDays((prev) => [...prev, ...result.days]);
        if (result.days.length < 7) {
          setNoMoreDays(true);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

  const oddsMap = buildOddsMap();

  if (!days || days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <span className="text-4xl mb-3">{category?.icon || "🏆"}</span>
        <p className="text-sm">No upcoming {category?.name || "games"} found in the next week.</p>
        {onLoadMore && !noMoreDays && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Search further ahead
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Context label */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <span className="text-lg">{category?.icon}</span>
        <span className="text-sm text-slate-400">
          Upcoming <strong className="text-slate-200">{category?.name}</strong> games
        </span>
      </div>

      {days.map((day) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <DateSectionHeader
            label={day.label}
            displayDate={day.displayDate}
            count={day.events.length}
          />

          <div className="space-y-2">
            {day.events.map((event) => {
              const matchedGame = findOddsForEvent(event, oddsMap);
              if (matchedGame) {
                return <GameCard key={event.id} game={matchedGame} index={0} />;
              }
              return <MatchupRow key={event.id} event={event} />;
            })}
          </div>
        </motion.div>
      ))}

      {/* Load more button */}
      <div className="pt-4 flex justify-center">
        {noMoreDays ? (
          <p className="text-xs text-slate-600">No more upcoming games found.</p>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Load more games
          </Button>
        )}
      </div>
    </div>
  );
}
