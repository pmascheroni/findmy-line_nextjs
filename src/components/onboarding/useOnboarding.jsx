import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/AuthContext";

const ONBOARDING_KEY = "findmyline_onboarding_completed";
const SHOW_GAME_TOUR_KEY = "findmyline_show_game_tour";

export function useOnboarding() {
  const [completedTours, setCompletedTours] = useState(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return {};
      const saved = window.localStorage.getItem(ONBOARDING_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [userHideTour, setUserHideTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userDoc, loading: authLoading } = useAuth();

  // Check if user has permanently hidden the tour
  useEffect(() => {
    if (authLoading) return;
    if (userDoc?.hideOnboardingTour) {
      setUserHideTour(true);
    }
    setIsLoading(false);
  }, [authLoading, userDoc]);

  const hasCompletedTour = (page) => {
    return completedTours[page] === true;
  };

  const completeTour = (page) => {
    const updated = { ...completedTours, [page]: true };
    setCompletedTours(updated);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
    }
  };

  const neverShowTour = async () => {
    // Save to localStorage for non-logged-in users
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("findmyline_never_show_tour", "true");
    }
    setUserHideTour(true);
    
    // Also save to user record if logged in
    if (user && db) {
      try {
        await updateDoc(doc(db, "users", user.uid), { hideOnboardingTour: true });
      } catch (err) {
        console.error("Failed to save tour preference:", err);
      }
    }
  };

  const resetAllTours = async () => {
    setCompletedTours({});
    setUserHideTour(false);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(ONBOARDING_KEY);
      window.localStorage.removeItem(SHOW_GAME_TOUR_KEY);
      window.localStorage.removeItem("findmyline_never_show_tour");
    }
    
    // Also reset user record if logged in
    if (user && db) {
      try {
        await updateDoc(doc(db, "users", user.uid), { hideOnboardingTour: false });
      } catch (err) {
        // Ignore error
      }
    }
  };

  const shouldShowTour = (page) => {
    // Check localStorage for never show preference
    const neverShow =
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("findmyline_never_show_tour") === "true";
    if (neverShow || userHideTour) return false;
    
    // For gameDetail, check if we were sent here from the home tour
    if (page === "gameDetail") {
      const showGameTour =
        typeof window !== "undefined" &&
        window.localStorage &&
        window.localStorage.getItem(SHOW_GAME_TOUR_KEY) === "true";
      return showGameTour && !hasCompletedTour(page);
    }
    return !hasCompletedTour(page);
  };

  // Check if user came from home tour clicking into a game
  const shouldShowGameDetailTour = () => {
    const neverShow =
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("findmyline_never_show_tour") === "true";
    if (neverShow || userHideTour) return false;
    return (
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem(SHOW_GAME_TOUR_KEY) === "true" &&
      !hasCompletedTour("gameDetail")
    );
  };

  return {
    hasCompletedTour,
    completeTour,
    neverShowTour,
    resetAllTours,
    shouldShowTour,
    shouldShowGameDetailTour,
    isLoading,
  };
}
