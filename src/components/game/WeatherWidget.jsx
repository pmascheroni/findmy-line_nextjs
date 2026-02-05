import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, Wind, Droplets, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WeatherWidget({ venue, gameDate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, [venue, gameDate]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
        <div className="flex items-center justify-center gap-2 text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Silently fail if weather unavailable
  }

  const { forecast, location } = weather;
  
  if (!forecast) return null;

  const getWeatherIcon = () => {
    const condition = forecast.condition?.text?.toLowerCase() || "";
    if (condition.includes("rain")) return <CloudRain className="w-6 h-6" />;
    if (condition.includes("snow")) return <CloudSnow className="w-6 h-6" />;
    if (condition.includes("cloud")) return <Cloud className="w-6 h-6" />;
    return <Cloud className="w-6 h-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">
            {getWeatherIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Game Day Weather
            </h3>
            <p className="text-xs text-slate-400">{location?.name}, {location?.region}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {Math.round(forecast.avgtemp_f)}°F
          </div>
          <p className="text-xs text-slate-400">{forecast.condition?.text}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-500/10">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-slate-500">Wind</p>
            <p className="text-sm font-medium text-white">{forecast.maxwind_mph} mph</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-slate-500">Humidity</p>
            <p className="text-sm font-medium text-white">{forecast.avghumidity}%</p>
          </div>
        </div>

        {forecast.daily_chance_of_rain > 0 && (
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Rain</p>
              <p className="text-sm font-medium text-white">{forecast.daily_chance_of_rain}%</p>
            </div>
          </div>
        )}

        {forecast.daily_chance_of_snow > 0 && (
          <div className="flex items-center gap-2">
            <CloudSnow className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Snow</p>
              <p className="text-sm font-medium text-white">{forecast.daily_chance_of_snow}%</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-slate-500">Range</p>
            <p className="text-sm font-medium text-white">{Math.round(forecast.mintemp_f)}-{Math.round(forecast.maxtemp_f)}°F</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
