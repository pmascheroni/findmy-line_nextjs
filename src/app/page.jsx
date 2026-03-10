"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { Loader2, AlertCircle, RefreshCw, Trophy, ChevronDown, ChevronRight, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import SportFilter from "@/components/odds/SportFilter";
import DatePicker from "@/components/odds/DatePicker";
import GameCard from "@/components/odds/GameCard";
import { useSubscription } from "@/components/subscription/SubscriptionContext";
import UpgradeBanner from "@/components/subscription/UpgradeBanner";
import { useSettings } from "@/components/settings/SettingsContext";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/components/onboarding/useOnboarding";
import SettingsModal from "@/components/settings/SettingsModal";
import { TOP_SPORTS, EXTRA_SPORTS, ALL_CATEGORIES, TOP_IDS } from "@/lib/sportsCatalog";
import PredictionMarketComparisonTable from "@/components/prediction/PredictionMarketComparisonTable";

const BOOKMAKERS = "draftkings,fanduel,betmgm,williamhill_us,espnbet";
const MAX_GAMES_PER_CATEGORY = 10;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PREDICTION_CATEGORIES = [
  { id: "sports", name: "Sports", icon: "🏆" },
  { id: "politics", name: "Politics", icon: "🏛️" },
  { id: "pop-culture", name: "Pop Culture", icon: "🎬" },
  { id: "economics", name: "Economics", icon: "📈" },
  { id: "crypto", name: "Crypto", icon: "₿" },
  { id: "elections", name: "Elections", icon: "🗳️" },
  { id: "other", name: "Other", icon: "✨" },
];
const PREDICTION_CATEGORY_LABELS = PREDICTION_CATEGORIES.reduce((acc, category) => {
  acc[category.id] = category.name;
  return acc;
}, {});

export default function Home() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [predictionCategory, setPredictionCategory] = useState("sports");
  const [predictionSearch, setPredictionSearch] = useState("");
  const [predictionMarkets, setPredictionMarkets] = useState([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionExpanded, setPredictionExpanded] = useState(false);
  const [predictionLastUpdated, setPredictionLastUpdated] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved =
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
        ? window.localStorage.getItem("findmyline_selected_date")
        : null;
    if (saved) {
      const savedDate = new Date(saved);
      if (!Number.isNaN(savedDate.valueOf()) && isSameDay(savedDate, new Date())) {
        return savedDate;
      }
    }
    return new Date();
  });
  const [gamesByCategory, setGamesByCategory] = useState({});
  const [eventsByCategory, setEventsByCategory] = useState({});
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [collapsedSports, setCollapsedSports] = useState({});
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [loadedCategories, setLoadedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState({});
  const [loadingEvents, setLoadingEvents] = useState({});
  const [errorsByCategory, setErrorsByCategory] = useState({});
  const { isPaid, userDoc } = useSubscription();
  const { isMarketsMode, selectedPredictionMarkets, selectedSportsbooks } = useSettings();
  const { shouldShowTour, completeTour, neverShowTour } = useOnboarding();
  const safeSelectedDate =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.valueOf()) ? selectedDate : new Date();
  const [tourSettingsOpen, setTourSettingsOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tourInitialized, setTourInitialized] = useState(false);
  const [tzOffset, setTzOffset] = useState(0);
  const oddsGroupCache = useRef({});
  const summaryLoaded = summary && Object.keys(summary).length > 0;
  const summaryLoadedRef = useRef(false);
  const isPro = userDoc?.subscriptionPlan === "pro";
  const showSportsView = !isMarketsMode || predictionCategory === "sports";

  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true);
    };
    window.addEventListener("startOnboardingTour", handleStartTour);
    return () => window.removeEventListener("startOnboardingTour", handleStartTour);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTzOffset(new Date().getTimezoneOffset());
  }, []);

  useEffect(() => {
    if (!mounted || tourInitialized) return;
    setShowTour(shouldShowTour("home"));
    setTourInitialized(true);
  }, [mounted, tourInitialized, shouldShowTour]);

  const toggleSportCollapse = (sportKey) => {
    setCollapsedSports((prev) => ({
      ...prev,
      [sportKey]: !prev[sportKey],
    }));
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.setItem === "function") {
      window.localStorage.setItem("findmyline_selected_date", safeSelectedDate.toISOString());
    }
  }, [selectedDate, safeSelectedDate]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(
        `/api/sports/summary?date=${safeSelectedDate.toISOString()}&tzOffset=${tzOffset}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setSummary(data.counts || {});
    } catch (err) {
      setSummary({});
    } finally {
      setSummaryLoading(false);
    }
  }, [safeSelectedDate, tzOffset]);

  const fetchPredictionMarkets = useCallback(
    async ({ force = false } = {}) => {
      if (!isMarketsMode || predictionCategory === "sports") return;
      setPredictionLoading(true);
      setPredictionError(null);
      try {
        const params = new URLSearchParams();
        params.set("category", predictionCategory);
        params.set("limit", "50");
        if (predictionSearch.trim()) {
          params.set("search", predictionSearch.trim());
        }
        if (Array.isArray(selectedPredictionMarkets) && selectedPredictionMarkets.length > 0) {
          params.set("sources", selectedPredictionMarkets.join(","));
        }
        if (force) {
          params.set("ts", String(Date.now()));
        }
        const res = await fetch(`/api/prediction/markets?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load prediction markets");
        }
        setPredictionMarkets(data.groupedMarkets || []);
        const rejectedSources = Array.isArray(data.rejectedSources) ? data.rejectedSources : [];
        const upstreamErrors = Object.values(data.errors || {}).filter(Boolean);
        setPredictionError(
          upstreamErrors[0] ||
            (rejectedSources.length > 0
              ? `${rejectedSources.join(", ")} not supported yet for prediction-market data.`
              : null)
        );
        setPredictionLastUpdated(new Date());
      } catch (err) {
        setPredictionError(err?.message || "Failed to load prediction markets");
        setPredictionMarkets([]);
      } finally {
        setPredictionLoading(false);
      }
    },
    [isMarketsMode, predictionCategory, predictionSearch, selectedPredictionMarkets]
  );

  useEffect(() => {
    if (!showSportsView) return;
    fetchSummary();
  }, [fetchSummary, showSportsView]);

  useEffect(() => {
    if (summaryLoaded) summaryLoadedRef.current = true;
  }, [summaryLoaded]);

  useEffect(() => {
    setGamesByCategory({});
    setEventsByCategory({});
    setLoadedCategories([]);
    setExpandedCategories([]);
    setErrorsByCategory({});
    setApiError(null);
  }, [safeSelectedDate, isMarketsMode, selectedPredictionMarkets, selectedSportsbooks]);

  useEffect(() => {
    if (!isMarketsMode) {
      setPredictionCategory("sports");
      setPredictionSearch("");
      setPredictionMarkets([]);
      setPredictionError(null);
      setPredictionExpanded(false);
    }
  }, [isMarketsMode]);

  useEffect(() => {
    if (!isMarketsMode || predictionCategory === "sports") return;
    setPredictionExpanded(false);
    setPredictionError(null);
    const timer = setTimeout(() => {
      fetchPredictionMarkets();
    }, 350);
    return () => clearTimeout(timer);
  }, [isMarketsMode, predictionCategory, predictionSearch, fetchPredictionMarkets]);

  useEffect(() => {
    if (predictionCategory === "sports") {
      setPredictionMarkets([]);
      setPredictionError(null);
      setPredictionExpanded(false);
    }
  }, [predictionCategory]);

  const availableTopSports = useMemo(() => {
    if (!summaryLoaded) return [];
    return TOP_SPORTS.filter((sport) => (summary[sport.id] || 0) > 0);
  }, [summary, summaryLoaded]);

  const availableExtraSports = useMemo(() => {
    if (!summaryLoaded) return [];
    return EXTRA_SPORTS.filter((sport) => sport.alwaysShow || (summary[sport.id] || 0) > 0);
  }, [summary, summaryLoaded]);

  const navSports = useMemo(() => {
    const base = [{ id: "all", name: "All", icon: "🏆" }];
    return base.concat([...availableTopSports, ...availableExtraSports]);
  }, [availableTopSports, availableExtraSports]);

  const visiblePredictionMarkets = useMemo(() => {
    if (predictionExpanded) return predictionMarkets;
    return predictionMarkets.slice(0, 5);
  }, [predictionExpanded, predictionMarkets]);

  useEffect(() => {
    if (!navSports.find((sport) => sport.id === selectedSport)) {
      setSelectedSport("all");
    }
  }, [navSports, selectedSport]);

  const fetchOdds = useCallback(
    async (sportsToFetch) => {
      const params = new URLSearchParams();
      params.set("sports", sportsToFetch.join(","));
      params.set("date", safeSelectedDate.toISOString());
      params.set("marketsMode", isMarketsMode ? "1" : "0");

      const sportsbooks =
        Array.isArray(selectedSportsbooks) && selectedSportsbooks.length > 0
          ? selectedSportsbooks.join(",")
          : BOOKMAKERS;
      params.set("sportsbooks", sportsbooks);

      if (Array.isArray(selectedPredictionMarkets) && selectedPredictionMarkets.length > 0) {
        params.set("predictionMarkets", selectedPredictionMarkets.join(","));
      }

      params.set("tzOffset", String(tzOffset));
      const response = await fetch(`/api/odds?${params.toString()}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Odds API request failed");
      }
      return data.games || [];
    },
    [safeSelectedDate, isMarketsMode, selectedSportsbooks, selectedPredictionMarkets, tzOffset]
  );

  const getOddsKeysForCategory = useCallback(async (category) => {
    if (!category) return [];
    if (Array.isArray(category.oddsKeys)) return category.oddsKeys;
    if (category.oddsGroup) {
      if (oddsGroupCache.current[category.oddsGroup]) {
        return oddsGroupCache.current[category.oddsGroup];
      }
      const res = await fetch("/api/odds/sports", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const keys = (data.sports || [])
        .filter((sport) => sport.active && sport.group === category.oddsGroup)
        .map((sport) => sport.key);
      const limitedKeys = keys.slice(0, 2);
      oddsGroupCache.current[category.oddsGroup] = limitedKeys;
      return limitedKeys;
    }
    return [];
  }, []);

  const setCategoryLoading = (categoryId, value) => {
    setLoadingCategories((prev) => ({ ...prev, [categoryId]: value }));
  };

  const setCategoryEventLoading = (categoryId, value) => {
    setLoadingEvents((prev) => ({ ...prev, [categoryId]: value }));
  };

  const setCategoryError = (categoryId, message) => {
    setErrorsByCategory((prev) => ({ ...prev, [categoryId]: message }));
  };

  const loadCategoryEvents = useCallback(
    async (category, force = false) => {
      if (!category) return;
      if (!force && eventsByCategory[category.id]?.length) return;
      setCategoryEventLoading(category.id, true);
      setCategoryError(
        category.id,
        category.id === "baseball_mlb"
          ? "Current MLB events are showing from ESPN, but the Odds API is not returning matching MLB lines yet — likely because these are spring-training/preseason games."
          : "Odds not available via Odds API."
      );
      try {
        const res = await fetch(
          `/api/sports/events?category=${category.id}&date=${safeSelectedDate.toISOString()}&tzOffset=${tzOffset}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch events");
        }
        setEventsByCategory((prev) => ({ ...prev, [category.id]: data.events || [] }));
      } catch (err) {
        setCategoryError(category.id, err?.message || "Failed to fetch events");
      } finally {
        setCategoryEventLoading(category.id, false);
      }
    },
    [eventsByCategory, safeSelectedDate, tzOffset]
  );

  const fetchTopOdds = useCallback(
    async (topCategories, force = false) => {
      const ids = topCategories.map((sport) => sport.id);
      const targets = force ? ids : ids.filter((id) => !loadedCategories.includes(id));
      if (targets.length === 0) return;

      setLoading(true);
      setApiError(null);
      try {
        const games = await fetchOdds(targets);
        const grouped = targets.reduce((acc, id) => ({ ...acc, [id]: [] }), {});
        games.forEach((game) => {
          if (!grouped[game.sport_key]) grouped[game.sport_key] = [];
          grouped[game.sport_key].push(game);
        });
        Object.keys(grouped).forEach((key) => {
          grouped[key] = grouped[key].sort(
            (a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
          );
        });
        setGamesByCategory((prev) => ({ ...prev, ...grouped }));
        setLoadedCategories((prev) => Array.from(new Set([...prev, ...targets])));
        setLastUpdated(new Date());

        const fallbackCategories = targets.filter(
          (id) => (grouped[id]?.length || 0) === 0 && (summary[id] || 0) > 0
        );
        if (fallbackCategories.length > 0) {
          await Promise.all(
            fallbackCategories.map(async (id) => {
              const category = ALL_CATEGORIES.find((sport) => sport.id === id);
              if (!category) return;
              await loadCategoryEvents(category, false);
            })
          );
        }
      } catch (err) {
        setApiError(err?.message || "Failed to fetch odds");
      } finally {
        setLoading(false);
      }
    },
    [fetchOdds, loadedCategories, loadCategoryEvents, summary]
  );

  const loadCategoryOdds = useCallback(
    async (category, force = false) => {
      if (!category) return;
      if (!force && loadedCategories.includes(category.id)) return;
      setCategoryLoading(category.id, true);
      setCategoryError(category.id, null);
      try {
        const oddsKeys = await getOddsKeysForCategory(category);
        if (!oddsKeys.length) {
          setCategoryError(category.id, category.id === "baseball_mlb" ? "MLB odds are not available from our Odds API source for the current spring-training style slate yet." : "Odds not available via Odds API.");
          return;
        }
        const games = await fetchOdds(oddsKeys);
        const sorted = [...games].sort(
          (a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
        if (sorted.length === 0) {
          setCategoryError(
            category.id,
            category.id === "baseball_mlb"
              ? "Current MLB events are showing from ESPN, but the Odds API is not returning matching MLB lines yet — likely because these are spring-training/preseason games."
              : "Odds not available via Odds API."
          );
          await loadCategoryEvents(category, false);
          setLoadedCategories((prev) => Array.from(new Set([...prev, category.id])));
          return;
        }
        setGamesByCategory((prev) => ({ ...prev, [category.id]: sorted }));
        setLoadedCategories((prev) => Array.from(new Set([...prev, category.id])));
        setLastUpdated(new Date());
      } catch (err) {
        setCategoryError(category.id, err?.message || "Failed to fetch odds");
      } finally {
        setCategoryLoading(category.id, false);
      }
    },
    [fetchOdds, getOddsKeysForCategory, loadedCategories, loadCategoryEvents]
  );

  useEffect(() => {
    if (!showSportsView) return;
    if (selectedSport !== "all") return;
    if (summaryLoading) return;
    if (!summaryLoadedRef.current) return;
    if (availableTopSports.length === 0) return;
    fetchTopOdds(availableTopSports);
  }, [showSportsView, selectedSport, availableTopSports, summaryLoading, fetchTopOdds]);

  useEffect(() => {
    if (!showSportsView) return;
    if (selectedSport === "all") return;
    const category = ALL_CATEGORIES.find((sport) => sport.id === selectedSport);
    if (!category) return;
    (async () => {
      const oddsKeys = await getOddsKeysForCategory(category);
      if (oddsKeys.length) {
        await loadCategoryOdds(category);
      } else {
        await loadCategoryEvents(category);
      }
    })();
  }, [showSportsView, selectedSport, getOddsKeysForCategory, loadCategoryOdds, loadCategoryEvents]);

  const handleExpandCategory = async (category) => {
    if (!loadedCategories.includes(category.id)) {
      const oddsKeys = await getOddsKeysForCategory(category);
      if (oddsKeys.length) {
        await loadCategoryOdds(category);
      } else {
        await loadCategoryEvents(category);
      }
    }
    if (!expandedCategories.includes(category.id)) {
      setExpandedCategories((prev) => [...prev, category.id]);
    }
  };

  const handleToggleExpanded = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const refreshOdds = useCallback(async () => {
    if (selectedSport === "all") {
      await fetchTopOdds(availableTopSports, true);
      const otherExpanded = expandedCategories.filter((id) => !TOP_IDS.includes(id));
      for (const id of otherExpanded) {
        const category = ALL_CATEGORIES.find((sport) => sport.id === id);
        if (category) {
          await loadCategoryOdds(category, true);
        }
      }
      return;
    }
    const category = ALL_CATEGORIES.find((sport) => sport.id === selectedSport);
    if (category) {
      await loadCategoryOdds(category, true);
    }
  }, [selectedSport, availableTopSports, expandedCategories, fetchTopOdds, loadCategoryOdds]);

  const handleRefresh = async () => {
    if (!showSportsView) {
      await fetchPredictionMarkets({ force: true });
      return;
    }
    if (isPro) {
      await refreshOdds();
    } else {
      await fetchSummary();
    }
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (!isPro || !showSportsView) return;
    const interval = setInterval(() => {
      refreshOdds();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [isPro, showSportsView, refreshOdds]);

  const renderEventsList = (events = []) => {
    if (!events.length) {
      return (
        <div className="text-sm text-slate-500 px-2">No events available.</div>
      );
    }
    return (
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2"
          >
            <div>
              <div className="text-sm text-white font-medium">{event.name}</div>
              {event.shortName && event.shortName !== event.name && (
                <div className="text-xs text-slate-400">{event.shortName}</div>
              )}
            </div>
            <div className="text-xs text-slate-500">{event.status || "Scheduled"}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderCategorySection = (category, games = []) => {
    const isCollapsed = collapsedSports[category.id];
    const isExpanded = expandedCategories.includes(category.id);
    const events = eventsByCategory[category.id] || [];
    const categoryError = errorsByCategory[category.id];
    const visibleGames = isExpanded ? games : games.slice(0, MAX_GAMES_PER_CATEGORY);
    const showMore = games.length > MAX_GAMES_PER_CATEGORY;
    const showEvents = games.length === 0 && events.length > 0;

    return (
      <div key={category.id} className="space-y-3">
        <button
          onClick={() => toggleSportCollapse(category.id)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{category.icon}</span>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">{category.name}</h3>
              <p className="text-xs text-slate-500">
                {showEvents ? `${events.length} events` : `${games.length} games`}
              </p>
            </div>
          </div>
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {!isCollapsed && (
          <div className="space-y-3">
            {showEvents && categoryError && (
              <div className="text-xs text-slate-400 px-2">
                Odds not available via Odds API.
              </div>
            )}
            {showEvents ? renderEventsList(events) : null}
            {!showEvents &&
              visibleGames.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            {showMore && (
              <button
                onClick={() => handleToggleExpanded(category.id)}
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300"
              >
                {isExpanded ? "Show less" : `Show more (${games.length - MAX_GAMES_PER_CATEGORY})`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOtherCategoryRow = (category) => {
    const count = summary[category.id] || 0;
    const loadingCategory = loadingCategories[category.id] || loadingEvents[category.id];
    const errorMessage = errorsByCategory[category.id];
    const hasOdds = !errorMessage || !errorMessage.includes("Odds not available");
    return (
      <div
        key={category.id}
        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{category.icon}</span>
          <div>
            <div className="text-sm font-semibold text-white">{category.name}</div>
            <div className="text-xs text-slate-500">{count} events</div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleExpandCategory(category)}
          disabled={loadingCategory}
          className="text-blue-400 hover:text-blue-300"
        >
          {loadingCategory ? "Loading..." : "Show more"}
        </Button>
        {errorMessage && !hasOdds && (
          <span className="text-xs text-red-400 ml-3">Odds not available via Odds API</span>
        )}
      </div>
    );
  };

  const formatDateLabel = () => {
    if (isToday(safeSelectedDate)) return "Today";
    return format(safeSelectedDate, "MMMM d");
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-xl bg-slate-900/40 animate-pulse" />
        <div className="h-10 rounded-xl bg-slate-900/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTour && (
        <OnboardingTour
          page="home"
          onComplete={() => {
            setShowTour(false);
            completeTour("home");
          }}
          onNeverShow={() => {
            setShowTour(false);
            neverShowTour();
          }}
          onOpenSettings={() => setTourSettingsOpen(true)}
          onCloseSettings={() => setTourSettingsOpen(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Today&apos;s Best Lines</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isMarketsMode ? "Prediction markets" : "Sportsbooks"}
              {showSportsView
                ? ` · ${formatDateLabel()}`
                : predictionCategory !== "sports"
                ? ` · ${PREDICTION_CATEGORY_LABELS[predictionCategory] || "Markets"}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading || predictionLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTour(true)}
              className="text-slate-400 hover:text-white"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isPaid && <UpgradeBanner />}

        {isMarketsMode && (
          <div className="flex-1" data-tour="prediction-category">
            <SportFilter
              sports={PREDICTION_CATEGORIES}
              selectedSport={predictionCategory}
              onSelectSport={(id) => setPredictionCategory(id)}
            />
          </div>
        )}

        {showSportsView ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1" data-tour="sport-filter">
              <SportFilter
                sports={navSports}
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
              />
            </div>
            <div className="flex items-center gap-2" data-tour="date-picker">
              <DatePicker selectedDate={safeSelectedDate} onDateChange={setSelectedDate} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={predictionSearch}
                onChange={(event) => setPredictionSearch(event.target.value)}
                placeholder="Search prediction markets..."
                className="pl-9 bg-slate-900/50 border-slate-800 text-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {predictionLastUpdated && (
                <span>Updated {format(predictionLastUpdated, "h:mm a")}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {showSportsView ? (
        <>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Live odds are temporarily unavailable.</span>
              </div>
            </motion.div>
          )}

          {loading && !summaryLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : selectedSport !== "all" ? (
            (() => {
              const category = ALL_CATEGORIES.find((sport) => sport.id === selectedSport);
              const games = category ? gamesByCategory[category.id] || [] : [];
              const events = category ? eventsByCategory[category.id] || [] : [];
              const errorMessage = category ? errorsByCategory[category.id] : null;
              if (!category) {
                return (
                  <div className="flex items-center justify-center py-20 text-slate-400">
                    <Trophy className="w-12 h-12 mb-3 text-slate-500" />
                    <p>No games found for this category.</p>
                  </div>
                );
              }
              if (loadingCategories[category.id] || loadingEvents[category.id]) {
                return (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                );
              }
              if (games.length === 0 && events.length > 0) {
                return <div className="space-y-4">{renderCategorySection(category, games)}</div>;
              }
              if (errorMessage) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Trophy className="w-12 h-12 mb-3 text-slate-500" />
                    <p>{errorMessage}</p>
                  </div>
                );
              }
              if (games.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Trophy className="w-12 h-12 mb-3 text-slate-500" />
                    <p>No games found for this date.</p>
                  </div>
                );
              }
              return <div className="space-y-4">{renderCategorySection(category, games)}</div>;
            })()
          ) : (
            <div className="space-y-4">
              {availableTopSports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Trophy className="w-12 h-12 mb-3 text-slate-500" />
                  <p>No games found for this date.</p>
                </div>
              )}

              {availableTopSports.map((category) => {
                const games = gamesByCategory[category.id] || [];
                const events = eventsByCategory[category.id] || [];
                if (!games.length && !events.length) return null;
                return renderCategorySection(category, games);
              })}

              {availableExtraSports.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm uppercase tracking-wider text-slate-500">More sports today</h3>
                  {availableExtraSports.map((category) => {
                    const games = gamesByCategory[category.id] || [];
                    const events = eventsByCategory[category.id] || [];
                    if (games.length > 0 || events.length > 0) {
                      return renderCategorySection(category, games);
                    }
                    return renderOtherCategoryRow(category);
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {predictionError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{predictionError}</span>
              </div>
            </motion.div>
          )}

          {predictionLoading && predictionMarkets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : predictionMarkets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Trophy className="w-12 h-12 mb-3 text-slate-500" />
              <p>{predictionSearch.trim() ? "No markets match that search." : "No prediction markets found."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictionLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Refreshing markets...
                </div>
              )}
              {visiblePredictionMarkets.map((market) => (
                <PredictionMarketComparisonTable
                  key={market.id}
                  marketGroup={market}
                  categoryLabel={PREDICTION_CATEGORY_LABELS[predictionCategory]}
                />
              ))}
              {predictionMarkets.length > 5 && (
                <button
                  onClick={() => setPredictionExpanded((prev) => !prev)}
                  className="w-full py-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  {predictionExpanded
                    ? "Show less"
                    : `Show more (${predictionMarkets.length - visiblePredictionMarkets.length})`}
                </button>
              )}
            </div>
          )}
        </>
      )}

      <SettingsModal open={tourSettingsOpen} onOpenChange={setTourSettingsOpen} />

      {showSportsView && lastUpdated && (
        <div className="text-xs text-slate-500 text-right">Last updated: {format(lastUpdated, "p")}</div>
      )}
    </div>
  );
}
