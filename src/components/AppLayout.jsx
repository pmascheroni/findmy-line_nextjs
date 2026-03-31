"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, Menu, ShoppingCart, Settings, MapPin, AlertTriangle, Home, Info } from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";
import { useBetSlip } from "@/components/game/BetSlipContext";
import { useSettings } from "@/components/settings/SettingsContext";
import SettingsModal from "@/components/settings/SettingsModal";
import { isStateLegal } from "@/components/legal/stateLegality";
import { useOnboarding } from "@/components/onboarding/useOnboarding";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createPageUrl } from "@/utils";

const UserLocationContext = createContext(null);

export function useUserLocation() {
  return useContext(UserLocationContext);
}

function LayoutContent({ children, userLocation, onStartTour }) {
  const pathname = usePathname();
  const router = useRouter();
  const { bets } = useBetSlip();
  const { isMarketsMode } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("books");
  const [menuOpen, setMenuOpen] = useState(false);

  const openSettings = (tab = "books") => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
  };

  const isLegal = !userLocation?.region || userLocation?.country !== "US" || isStateLegal(userLocation.region);
  const showLocationWarning = !isLegal && !isMarketsMode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-slate-900 border-slate-800 p-0 [&>button]:text-white [&>button:hover]:text-slate-300">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-800">
                      <Link href={createPageUrl("Home")} onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">FindMyLine</span>
                      </Link>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                      <Link
                        href={createPageUrl("Home")}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          pathname === "/"
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span>Games</span>
                      </Link>
                      <Link
                        href={createPageUrl("About")}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          pathname?.startsWith("/about")
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        }`}
                      >
                        <Info className="w-5 h-5" />
                        <span>About</span>
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          openSettings("books");
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all w-full text-left"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(createPageUrl("Home"));
                          setTimeout(() => onStartTour(), 100);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all w-full text-left"
                      >
                        <Info className="w-5 h-5" />
                        <span>How To Use</span>
                      </button>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <Link
                href={createPageUrl("Home")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border border-slate-800/60 bg-slate-900/60 text-white hover:bg-slate-800/70 ${
                  pathname === "/" ? "ring-1 ring-blue-500/40" : ""
                }`}
              >
                <span className="font-semibold text-sm">FindMy-Line</span>
              </Link>

              <button
                onClick={() => openSettings(isMarketsMode ? "markets" : "books")}
                data-tour="mode-toggle"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all hover:bg-slate-800/50 ${
                  showLocationWarning ? "text-red-400" : isMarketsMode ? "text-purple-400" : "text-green-400"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className={`w-4 h-1.5 rounded-full ${isMarketsMode ? "bg-purple-500" : "bg-slate-500"}`} />
                  <div className={`w-4 h-1.5 rounded-full ${!isMarketsMode ? "bg-green-500" : "bg-slate-500"}`} />
                </div>
                {userLocation?.region && userLocation?.country === "US" && (
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{userLocation.region}</span>
                    {showLocationWarning && <AlertTriangle className="w-3 h-3" />}
                  </div>
                )}
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {isMarketsMode ? "Markets" : "Books"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href={createPageUrl("BetCheckout")}
                prefetch={false}
                data-tour="bet-slip"
                className="relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Bet Slip</span>
                {bets.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                    {bets.length}
                  </span>
                )}
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} initialTab={settingsInitialTab} />

      <footer className="border-t border-slate-800/50 mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} FindMyLine. For informational purposes only.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live odds updates
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppLayout({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [tourTrigger, setTourTrigger] = useState(0);

  const handleStartTour = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("findmyline_onboarding_completed");
      window.localStorage.removeItem("findmyline_show_game_tour");
    }
    setTourTrigger((prev) => prev + 1);
    window.dispatchEvent(new CustomEvent("startOnboardingTour"));
  };

  useEffect(() => {
    const fetchLocation = async () => {
      if (typeof window === "undefined") return;
      if (userLocation?.timezone) return;

      const saved = window.localStorage ? window.localStorage.getItem("userLocation") : null;
      if (saved) {
        try {
          setUserLocation(JSON.parse(saved));
          return;
        } catch {}
      }

      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const locationData = {
          display: data.country_code === "US" && data.region_code ? data.region_code : data.country_name,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          utcOffset: data.utc_offset,
          country: data.country_code,
          region: data.region_code,
        };
        setUserLocation(locationData);
        if (window.localStorage) {
          window.localStorage.setItem("userLocation", JSON.stringify(locationData));
        }
      } catch (err) {
        const fallback = {
          display: "Local",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          utcOffset: null,
        };
        setUserLocation(fallback);
      }
    };

    fetchLocation();
  }, [userLocation?.timezone]);

  return (
    <UserLocationContext.Provider value={userLocation}>
      <LayoutContent key={tourTrigger} userLocation={userLocation} onStartTour={handleStartTour}>
        {children}
      </LayoutContent>
    </UserLocationContext.Provider>
  );
}
