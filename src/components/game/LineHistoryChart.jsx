import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useSettings, ALL_PREDICTION_MARKETS } from "../settings/SettingsContext";

const SPORTSBOOKS = [
  { key: "draftkings", name: "DraftKings", short: "DK" },
  { key: "fanduel", name: "FanDuel", short: "FD" },
  { key: "betmgm", name: "BetMGM", short: "MGM" },
  { key: "williamhill_us", name: "Caesars", short: "CZR" },
  { key: "espnbet", name: "ESPN BET", short: "ESPN" },
];

// Color mapping for sportsbooks
const BOOK_COLORS = {
  draftkings: "#53D337",
  fanduel: "#1493FF",
  betmgm: "#BFA15C",
  williamhill_us: "#005249",
  espnbet: "#E31837",
};

// Color mapping for prediction markets
const MARKET_COLORS = {
  polymarket: "#7C3AED",
  kalshi: "#EC4899",
  predictit: "#F59E0B",
  betfair_ex_us: "#FF6B00",
  matchbook: "#10B981",
};

export default function LineHistoryChart({ game, historicalData }) {
  const { isMarketsMode, selectedPredictionMarkets } = useSettings();
  const [selectedMarket, setSelectedMarket] = useState("h2h");
  const [selectedOutcome, setSelectedOutcome] = useState(game.home_team);
  const [selectedBooks, setSelectedBooks] = useState(() => 
    isMarketsMode 
      ? selectedPredictionMarkets.slice(0, 2) 
      : ["draftkings", "fanduel"]
  );
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  
  // Get the appropriate sources list based on mode
  const SOURCES = useMemo(() => {
    if (isMarketsMode) {
      return selectedPredictionMarkets.map(key => {
        const market = ALL_PREDICTION_MARKETS.find(m => m.key === key);
        return { key, name: market?.name || key, short: market?.short || key };
      });
    }
    return SPORTSBOOKS;
  }, [isMarketsMode, selectedPredictionMarkets]);
  
  // Get colors based on mode
  const SOURCE_COLORS = isMarketsMode ? MARKET_COLORS : BOOK_COLORS;

  // Get available markets
  const availableMarkets = useMemo(() => {
    const markets = new Set();
    game.bookmakers?.forEach(book => {
      book.markets?.forEach(m => markets.add(m.key));
    });
    return Array.from(markets);
  }, [game]);

  // Get available outcomes for selected market
  const availableOutcomes = useMemo(() => {
    const outcomes = new Set();
    game.bookmakers?.forEach(book => {
      const market = book.markets?.find(m => m.key === selectedMarket);
      market?.outcomes?.forEach(o => outcomes.add(o.name));
    });
    return Array.from(outcomes);
  }, [game, selectedMarket]);

  // Reset selected books when mode changes
  useEffect(() => {
    if (isMarketsMode) {
      setSelectedBooks(selectedPredictionMarkets.slice(0, 2));
    } else {
      setSelectedBooks(["draftkings", "fanduel"]);
    }
  }, [isMarketsMode, selectedPredictionMarkets]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Fetch historical odds data
  useEffect(() => {
    setLoading(true);
    if (Array.isArray(historicalData) && historicalData.length > 0) {
      setHistoryData(historicalData);
    } else {
      setHistoryData([]);
    }
    setLoading(false);
  }, [game.id, selectedMarket, selectedOutcome, isMarketsMode, historicalData]);

  // Process historical data for chart
  const chartData = useMemo(() => {
    // Get the source key field based on mode
    const sourceField = isMarketsMode ? 'market_source' : 'sportsbook';
    
    if (historyData.length === 0) {
      // Show current odds only if no history
      const currentPoint = { time: hasHydrated ? format(new Date(), "HH:mm") : "—" };
      selectedBooks.forEach(bookKey => {
        const bookmaker = game.bookmakers?.find(b => b.key === bookKey);
        const market = bookmaker?.markets?.find(m => m.key === selectedMarket);
        const outcome = market?.outcomes?.find(o => o.name === selectedOutcome);
        if (outcome) {
          currentPoint[bookKey] = outcome.price;
        }
      });
      return [currentPoint];
    }

    // Group by timestamp
    const timeMap = new Map();
    
    historyData.forEach(record => {
      const recordSource = record[sourceField];
      if (selectedBooks.includes(recordSource)) {
        const timeKey = format(parseISO(record.timestamp), "HH:mm");
        
        if (!timeMap.has(timeKey)) {
          timeMap.set(timeKey, { time: timeKey });
        }
        
        const point = timeMap.get(timeKey);
        point[recordSource] = record.odds;
      }
    });

    // Convert to array and sort by time
    const points = Array.from(timeMap.values()).sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });

    return points;
  }, [historyData, selectedBooks, game, selectedMarket, selectedOutcome, isMarketsMode, hasHydrated]);

  // Calculate trend for each book
  const getTrend = (bookKey) => {
    if (chartData.length < 2) return "neutral";
    const first = chartData[0][bookKey];
    const last = chartData[chartData.length - 1][bookKey];
    if (!first || !last) return "neutral";
    if (last > first) return "up";
    if (last < first) return "down";
    return "neutral";
  };

  const marketLabels = {
    h2h: "Moneyline",
    spreads: "Spread",
    totals: "Total",
  };

  const toggleBook = (bookKey) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookKey)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(b => b !== bookKey);
      }
      return [...prev, bookKey];
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((entry, idx) => {
          const source = SOURCES.find(b => b.key === entry.dataKey);
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: entry.color }}>
                {source?.short || entry.dataKey}
              </span>
              <span className="text-white font-semibold">
                {entry.value > 0 ? `+${entry.value}` : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Market</label>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {availableMarkets.map(market => (
                <SelectItem key={market} value={market} className="text-white hover:bg-slate-700">
                  {marketLabels[market] || market}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-500">Selection</label>
          <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {availableOutcomes.map(outcome => (
                <SelectItem key={outcome} value={outcome} className="text-white hover:bg-slate-700">
                  {outcome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Source Toggles (Sportsbooks or Prediction Markets) */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(source => {
          const isSelected = selectedBooks.includes(source.key);
          const trend = getTrend(source.key);
          const color = SOURCE_COLORS[source.key] || "#6366f1";
          
          return (
            <button
              key={source.key}
              onClick={() => toggleBook(source.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-offset-slate-900"
                  : "opacity-50 hover:opacity-75"
              }`}
              style={{
                backgroundColor: isSelected ? `${color}20` : "transparent",
                borderColor: color,
                color: isSelected ? color : "#94a3b8",
                ringColor: color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {source.short}
              {isSelected && trend !== "neutral" && (
                trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )
              )}
            </button>
          );
        })}
      </div>

      {/* No Data Message */}
      {!loading && historyData.length === 0 && (
        <div className="bg-slate-800/30 rounded-lg p-6 text-center">
          <p className="text-slate-400 text-sm mb-2">No historical data available yet</p>
          <p className="text-slate-500 text-xs">
            Historical odds tracking will begin once games start. Check back later to see line movements.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Chart */}
      {!loading && historyData.length > 0 && (
        <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => (value > 0 ? `+${value}` : value)}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
            
            {selectedBooks.map(bookKey => (
              <Line
                key={bookKey}
                type="monotone"
                dataKey={bookKey}
                stroke={SOURCE_COLORS[bookKey] || "#6366f1"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-400" />
          Odds improving (for bettor)
        </span>
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-red-400" />
          Odds worsening
        </span>
      </div>
    </div>
  );
}
