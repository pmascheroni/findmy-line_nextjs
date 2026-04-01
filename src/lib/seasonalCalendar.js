// src/lib/seasonalCalendar.js

// Seasonal calendar for major sports
// Each sport has one or more seasons per year
// Format: { sportId, seasons: [{ startMonth, startDay, endMonth, endDay, yearOffset? }, ...] }
// yearOffset: 0 = same year as start, 1 = next year (for seasons crossing year boundary)

export const SEASONAL_CALENDAR = [
  {
    id: 'americanfootball_nfl',
    name: 'NFL',
    seasons: [
      // Regular season: early Sep to early Jan
      { startMonth: 8, startDay: 1, endMonth: 0, endDay: 7, yearOffset: 1 }, // Sep 1 to Jan 7
      // Combine with preseason (Aug) and playoffs (Jan-Feb)
      { startMonth: 7, startDay: 1, endMonth: 1, endDay: 15, yearOffset: 1 }, // Aug 1 to Feb 15
    ]
  },
  {
    id: 'americanfootball_ncaaf',
    name: 'NCAAF',
    seasons: [
      // College football: late Aug to early Jan
      { startMonth: 7, startDay: 20, endMonth: 0, endDay: 15, yearOffset: 1 }, // Aug 20 to Jan 15
    ]
  },
  {
    id: 'basketball_nba',
    name: 'NBA',
    seasons: [
      // Regular season: mid-Oct to mid-Apr
      { startMonth: 9, startDay: 15, endMonth: 3, endDay: 15 }, // Oct 15 to Apr 15
      // Playoffs: Apr to June
      { startMonth: 3, startDay: 16, endMonth: 5, endDay: 30 }, // Apr 16 to June 30
    ]
  },
  {
    id: 'basketball_ncaab',
    name: 'NCAAB',
    seasons: [
      // College basketball: Nov to Apr
      { startMonth: 10, startDay: 1, endMonth: 3, endDay: 15 }, // Nov 1 to Apr 15
      // March Madness: Mar to Apr
      { startMonth: 2, startDay: 10, endMonth: 3, endDay: 15 }, // Mar 10 to Apr 15
    ]
  },
  {
    id: 'baseball_mlb',
    name: 'MLB',
    seasons: [
      // Regular season: late Mar to late Sep
      { startMonth: 2, startDay: 20, endMonth: 8, endDay: 30 }, // Mar 20 to Sep 30
      // Postseason: Oct to early Nov
      { startMonth: 8, startDay: 31, endMonth: 10, endDay: 10 }, // Sep 31 to Nov 10
    ]
  },
  {
    id: 'icehockey_nhl',
    name: 'NHL',
    seasons: [
      // Regular season: early Oct to mid-Apr
      { startMonth: 9, startDay: 1, endMonth: 3, endDay: 15 }, // Oct 1 to Apr 15
      // Playoffs: Apr to June
      { startMonth: 3, startDay: 16, endMonth: 5, endDay: 30 }, // Apr 16 to June 30
    ]
  },
  {
    id: 'soccer_epl',
    name: 'Premier League',
    seasons: [
      // Premier League: Aug to May
      { startMonth: 7, startDay: 1, endMonth: 4, endDay: 31 }, // Aug 1 to May 31
    ]
  },
  {
    id: 'soccer_usa_mls',
    name: 'MLS',
    seasons: [
      // MLS: Feb to Oct (regular season)
      { startMonth: 1, startDay: 1, endMonth: 9, endDay: 31 }, // Feb 1 to Oct 31
      // Playoffs: Nov to Dec
      { startMonth: 9, startDay: 1, endMonth: 11, endDay: 15 }, // Oct 1 to Dec 15
    ]
  },
  {
    id: 'soccer_fifa_world_cup',
    name: 'World Cup',
    // Visibility window set in sportsCatalog (2026-03-01 to 2026-07-19)
    // No seasons entry needed here — the catalog visibilityWindow controls display
  },
  {
    id: 'golf_masters_tournament_winner',
    name: 'Masters',
    seasons: [
      // Masters futures open well before the tournament; show from mid-Feb through mid-Apr
      { startMonth: 1, startDay: 15, endMonth: 3, endDay: 15 }, // Feb 15 to Apr 15
    ]
  },
  {
    id: 'golf_pga_championship_winner',
    name: 'PGA Championship',
    seasons: [
      // PGA Championship: futures from early Apr, tournament in May
      { startMonth: 3, startDay: 1, endMonth: 4, endDay: 31 }, // Apr 1 to May 31
    ]
  },
  {
    id: 'golf_us_open_winner',
    name: 'US Open (Golf)',
    seasons: [
      // US Open: futures from early May, tournament in June
      { startMonth: 4, startDay: 1, endMonth: 5, endDay: 30 }, // May 1 to Jun 30
    ]
  },
  {
    id: 'golf_the_open_championship_winner',
    name: 'The Open',
    seasons: [
      // The Open: futures from early Jun, tournament in July
      { startMonth: 5, startDay: 1, endMonth: 6, endDay: 31 }, // Jun 1 to Jul 31
    ]
  },
  {
    id: 'mma_mixed_martial_arts',
    name: 'UFC',
    seasons: [
      // UFC year-round but more active certain periods
      { startMonth: 0, startDay: 1, endMonth: 11, endDay: 31 }, // All year
    ]
  },
  {
    id: 'tennis_atp_miami_open',
    name: 'ATP Miami Open',
    seasons: [
      // Miami Open: March tournament
      { startMonth: 2, startDay: 15, endMonth: 2, endDay: 31 }, // Mar 15-31
    ]
  },
  {
    id: 'tennis_wta_miami_open',
    name: 'WTA Miami Open',
    seasons: [
      // Miami Open: March tournament
      { startMonth: 2, startDay: 15, endMonth: 2, endDay: 31 }, // Mar 15-31
    ]
  },
  {
    id: 'boxing_boxing',
    name: 'Boxing',
    seasons: [
      { startMonth: 0, startDay: 1, endMonth: 11, endDay: 31 }, // All year
    ]
  },
  {
    id: 'rugbyleague_nrl',
    name: 'NRL',
    seasons: [
      // NRL: Mar to Oct
      { startMonth: 2, startDay: 1, endMonth: 9, endDay: 31 }, // Mar 1 to Oct 31
    ]
  },
  {
    id: 'cricket_ipl',
    name: 'IPL Cricket',
    seasons: [
      // IPL: April to June
      { startMonth: 3, startDay: 1, endMonth: 5, endDay: 30 }, // Apr 1 to Jun 30
    ]
  },
  {
    id: 'aussierules_afl',
    name: 'AFL',
    seasons: [
      // AFL: Mar to Sep
      { startMonth: 2, startDay: 1, endMonth: 8, endDay: 30 }, // Mar 1 to Sep 30
    ]
  },
  {
    id: 'soccer_germany_bundesliga',
    name: 'Bundesliga',
    seasons: [
      { startMonth: 7, startDay: 1, endMonth: 4, endDay: 31 }, // Aug 1 to May 31
    ]
  },
  {
    id: 'soccer_spain_la_liga',
    name: 'La Liga',
    seasons: [
      { startMonth: 7, startDay: 1, endMonth: 4, endDay: 31 }, // Aug 1 to May 31
    ]
  },
  {
    id: 'soccer_italy_serie_a',
    name: 'Serie A',
    seasons: [
      { startMonth: 7, startDay: 1, endMonth: 4, endDay: 31 }, // Aug 1 to May 31
    ]
  },
  {
    id: 'soccer_france_ligue_one',
    name: 'Ligue 1',
    seasons: [
      { startMonth: 7, startDay: 1, endMonth: 4, endDay: 31 }, // Aug 1 to May 31
    ]
  },
  {
    id: 'soccer_uefa_champs_league',
    name: 'Champions League',
    seasons: [
      // Group stage to final: Sep to Jun
      { startMonth: 8, startDay: 1, endMonth: 5, endDay: 30 }, // Sep 1 to Jun 30
    ]
  },
  {
    id: 'soccer_conmebol_copa_libertadores',
    name: 'Copa Libertadores',
    seasons: [
      { startMonth: 0, startDay: 1, endMonth: 11, endDay: 31 }, // All year (tournament spans calendar year)
    ]
  },
  // Olympics removed — 2024 Paris Olympics are over
];

// Helper to check if a date is within any season for a sport
export function isSportInSeason(sportId, date = new Date()) {
  try {
    const calendarEntry = SEASONAL_CALENDAR.find(entry => entry.id === sportId);
    
    // If no calendar entry, assume always in season (show always)
    if (!calendarEntry || !calendarEntry.seasons) return true;
    
    const checkDate = new Date(date);
    const year = checkDate.getFullYear();
    
    return calendarEntry.seasons.some(season => {
      // Auto-detect cross-year seasons: if endMonth < startMonth (e.g. Oct→Apr),
      // or yearOffset is explicitly set, the season crosses the year boundary.
      const crossesYear = season.yearOffset === 1 || (season.endMonth < season.startMonth && !season.yearOffset && season.yearOffset !== 0);

      if (crossesYear) {
        // Check two windows: [start in previous year → end this year] OR [start this year → end next year]
        const startA = new Date(year - 1, season.startMonth, season.startDay);
        const endA   = new Date(year, season.endMonth, season.endDay);
        const startB = new Date(year, season.startMonth, season.startDay);
        const endB   = new Date(year + 1, season.endMonth, season.endDay);
        return (checkDate >= startA && checkDate <= endA) || (checkDate >= startB && checkDate <= endB);
      }
      
      // Same-year season
      const startDate = new Date(year, season.startMonth, season.startDay);
      const endDate = new Date(year, season.endMonth, season.endDay);
      return checkDate >= startDate && checkDate <= endDate;
    });
  } catch (error) {
    console.error(`Error checking season for ${sportId}:`, error);
    return true; // Fallback: show always
  }
}

// Get all sports that are in season for a given date
// Note: This function should be called with sports passed in to avoid circular deps
export function getSportsInSeason(sports = [], date = new Date()) {
  return sports.filter(sport => isSportInSeason(sport.id, date));
}

// Get next date when a sport will have events (simplified: next in-season date)
// In real implementation, this would query the API for next event
export function getNextEventDateForSport(sportId, fromDate = new Date()) {
  const calendarEntry = SEASONAL_CALENDAR.find(entry => entry.id === sportId);
  if (!calendarEntry) return fromDate; // Fallback to current date
  
  const from = new Date(fromDate);
  const year = from.getFullYear();
  
  // Find the next season start date
  let nextStart = null;
  
  for (const season of calendarEntry.seasons) {
    const startDate = new Date(year, season.startMonth, season.startDay);
    const endDate = new Date(year + (season.yearOffset || 0), season.endMonth, season.endDay);
    
    // If season hasn't started yet this year
    if (from < startDate) {
      if (!nextStart || startDate < nextStart) {
        nextStart = startDate;
      }
    }
    // If we're in the season already
    else if (from >= startDate && from <= endDate) {
      return from; // Already in season
    }
  }
  
  // If no future season this year, check next year
  if (!nextStart) {
    for (const season of calendarEntry.seasons) {
      const startDate = new Date(year + 1, season.startMonth, season.startDay);
      if (!nextStart || startDate < nextStart) {
        nextStart = startDate;
      }
    }
  }
  
  return nextStart || from;
}