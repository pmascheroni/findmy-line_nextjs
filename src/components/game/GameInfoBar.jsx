import { useState, useEffect } from "react";
import { MapPin, Cloud, Sun, CloudRain, Snowflake, Building2, Trees, Loader2 } from "lucide-react";

export default function GameInfoBar({ homeTeam, awayTeam, gameDate, venue, allTeams, sportKey, onTeamRecords }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [venueData, setVenueData] = useState(null);
  const [venueLoading, setVenueLoading] = useState(false);

  useEffect(() => {
    setVenueLoading(false);
  }, []);

  // Determine final venue info - prefer ESPN data, fall back to team data
  const stadiumName = venueData?.name || venue || homeTeam?.stadium_name;
  const stadiumLocation = venueData?.location || homeTeam?.stadium_location || 
    (homeTeam?.city && homeTeam?.state ? `${homeTeam.city}, ${homeTeam.state}` : null);
  const isIndoor = venueData?.indoor ?? homeTeam?.is_indoor ?? null;

  useEffect(() => {
    setWeatherLoading(false);
  }, []);

  const getWeatherIcon = (condition) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain") || c.includes("shower")) return <CloudRain className="w-4 h-4 text-blue-400" />;
    if (c.includes("snow")) return <Snowflake className="w-4 h-4 text-cyan-300" />;
    if (c.includes("cloud") || c.includes("overcast")) return <Cloud className="w-4 h-4 text-slate-400" />;
    return <Sun className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 pt-6 border-t border-slate-800/50">
      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <MapPin className="w-4 h-4 text-slate-500" />
        <span>{stadiumName || "TBD"}</span>
        {stadiumLocation && (
          <span className="text-slate-600">· {stadiumLocation}</span>
        )}
      </div>

      {/* Indoor/Outdoor */}
      {isIndoor !== null && (
        <div className="flex items-center gap-2 text-sm">
          {isIndoor ? (
            <>
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400">Indoor</span>
            </>
          ) : (
            <>
              <Trees className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Outdoor</span>
            </>
          )}
        </div>
      )}

      {/* Weather */}
      <div className="flex items-center gap-2 text-sm">
        {isIndoor === true ? (
          <span className="text-slate-500">Climate controlled</span>
        ) : weatherLoading ? (
          <span className="text-slate-500">Loading weather...</span>
        ) : weather?.forecast ? (
          <>
            {getWeatherIcon(weather.forecast.condition)}
            <span className="text-slate-300">{weather.forecast.temp_f}°F</span>
            <span className="text-slate-500">· {weather.forecast.condition}</span>
          </>
        ) : (
          <span className="text-slate-600">No weather data</span>
        )}
      </div>
    </div>
  );
}
