import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEPS = {
  home: [
    {
      id: "welcome",
      title: "Welcome to FindMyLine! 🎉",
      description: "Compare odds across sportsbooks and prediction markets to find the best lines. Let's show you around!",
      position: "center",
    },
    {
      id: "mode-toggle",
      title: "Books vs Markets",
      description: "This shows your current mode. Click 'Next' to open settings and see how to switch between Sportsbooks and Prediction Markets.",
      target: "[data-tour='mode-toggle']",
      position: "below",
      actionOnNext: "openSettings",
    },
    {
      id: "settings-modal",
      title: "Customize Your View",
      description: "Here you can switch between Books and Markets mode using the tabs. Add or remove sportsbooks/markets to compare - up to 5 at a time! When you're ready, click 'Next' to continue.",
      position: "bottom-right",
      actionOnNext: "closeSettings",
      lightBackdrop: true,
      settingsOpen: true,
    },
    {
      id: "sport-filter",
      title: "Filter by Sport",
      description: "Browse games by sport - NFL, NBA, MLB, NHL, and college sports. Select 'All' to see everything.",
      target: "[data-tour='sport-filter']",
      position: "below",
    },
    {
      id: "date-picker",
      title: "Select a Date",
      description: "View games for today, tomorrow, or any upcoming date.",
      target: "[data-tour='date-picker']",
      position: "below",
    },
    {
      id: "game-card",
      title: "Game Cards",
      description: "Each card shows a matchup with odds preview. Click 'Next' to open a game and see detailed odds!",
      target: "[data-tour='game-card']",
      position: "above",
      actionOnNext: "clickGame",
    },
  ],
  gameDetail: [
    {
      id: "game-overview",
      title: "Game Details",
      description: "Here you see the full matchup with teams, game time, and live scores when available.",
      position: "center",
    },
    {
      id: "market-section",
      title: "Compare All Odds",
      description: "View moneyline, spread, and totals across all your sportsbooks. Green highlights show the best odds available!",
      target: "[data-tour='market-section']",
      position: "above",
    },
    {
      id: "select-bet",
      title: "Select a Bet",
      description: "Click 'Next' to select the best odds (green). This adds it to your bet slip for easy payout calculation!",
      target: "[data-tour='market-section']",
      position: "above",
      actionOnNext: "selectBestBet",
    },
    {
      id: "bet-calculator",
      title: "Bet Calculator",
      description: "Your selection appears here! Adjust your wager amount to see potential payouts. The calculator shows exactly what you'd win.",
      target: "[data-tour='bet-calculator']",
      position: "above",
      waitForElement: true,
    },
    {
      id: "place-bet",
      title: "Place Your Bet",
      description: "When you're ready, click 'Place Bet' to go directly to that sportsbook with your selection. That's it - you're a pro!",
      target: "[data-tour='place-bet-button']",
      position: "above",
      waitForElement: true,
    },
    {
      id: "complete",
      title: "You're All Set! 🎯",
      description: "Now you know how to find the best lines and place bets. Happy betting!",
      position: "center",
    },
  ],
};

export default function OnboardingTour({ page = "home", onComplete, onNeverShow, onOpenSettings, onCloseSettings }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ top: "50%", left: "50%" });
  const [waitingForElement, setWaitingForElement] = useState(false);

  const steps = TOUR_STEPS[page] || TOUR_STEPS.home;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position based on target element
  const updateTooltipPosition = useCallback(() => {
    const isMobile = window.innerWidth < 640;
    
    // On mobile, always position at the bottom using CSS classes
    if (isMobile) {
      setTooltipPosition({ isMobile: true });
      return;
    }
    
    if (step.position === "center") {
      setTooltipPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }
    
    if (step.position === "bottom-right") {
      const tooltipWidth = 350;
      const tooltipHeight = 220;
      setTooltipPosition({ 
        top: `${window.innerHeight - tooltipHeight - 100}px`, 
        left: `${window.innerWidth - tooltipWidth - 40}px`,
        transform: "" 
      });
      return;
    }

    if (!step?.target) {
      setTooltipPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      if (step.waitForElement) {
        setWaitingForElement(true);
      }
      return;
    }

    setWaitingForElement(false);
    const rect = element.getBoundingClientRect();
    const padding = 20;
    const tooltipWidth = 350;
    const tooltipHeight = 220;
    
    // Calculate center of the element
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;
    
    // Calculate center of the screen
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Determine best position based on where element is relative to screen center
    // Place tooltip on the side closest to center (so it doesn't go off-screen)
    let top, left, transform = "";
    let bestPosition = step.position;
    
    // Auto-determine best position if not center
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    
    // Check if there's enough space in each direction
    const canGoAbove = spaceAbove > tooltipHeight + padding;
    const canGoBelow = spaceBelow > tooltipHeight + padding;
    const canGoLeft = spaceLeft > tooltipWidth + padding;
    const canGoRight = spaceRight > tooltipWidth + padding;
    
    // Prefer vertical positioning, then choose based on available space
    if (elementCenterY > screenCenterY && canGoAbove) {
      // Element is in bottom half, place tooltip above
      bestPosition = "above";
    } else if (elementCenterY <= screenCenterY && canGoBelow) {
      // Element is in top half, place tooltip below
      bestPosition = "below";
    } else if (elementCenterX > screenCenterX && canGoLeft) {
      // Element is on right side, place tooltip to left
      bestPosition = "left";
    } else if (elementCenterX <= screenCenterX && canGoRight) {
      // Element is on left side, place tooltip to right
      bestPosition = "right";
    } else if (canGoBelow) {
      bestPosition = "below";
    } else if (canGoAbove) {
      bestPosition = "above";
    }

    switch (bestPosition) {
      case "below":
        top = rect.bottom + padding;
        left = Math.max(padding, Math.min(elementCenterX, window.innerWidth - tooltipWidth - padding));
        transform = "translateX(-50%)";
        // Adjust if too close to edges
        if (elementCenterX < tooltipWidth / 2 + padding) {
          left = padding;
          transform = "";
        } else if (elementCenterX > window.innerWidth - tooltipWidth / 2 - padding) {
          left = window.innerWidth - tooltipWidth - padding;
          transform = "";
        }
        break;
      case "above":
        top = rect.top - padding - tooltipHeight;
        left = Math.max(padding, Math.min(elementCenterX, window.innerWidth - tooltipWidth - padding));
        transform = "translateX(-50%)";
        if (elementCenterX < tooltipWidth / 2 + padding) {
          left = padding;
          transform = "";
        } else if (elementCenterX > window.innerWidth - tooltipWidth / 2 - padding) {
          left = window.innerWidth - tooltipWidth - padding;
          transform = "";
        }
        break;
      case "left":
        top = elementCenterY - tooltipHeight / 2;
        left = rect.left - padding - tooltipWidth;
        transform = "";
        break;
      case "right":
        top = elementCenterY - tooltipHeight / 2;
        left = rect.right + padding;
        transform = "";
        break;
      case "bottom-right":
        // Position in bottom right corner of screen, avoiding overlap with modals
        top = window.innerHeight - tooltipHeight - 100;
        left = window.innerWidth - tooltipWidth - 40;
        transform = "";
        break;
      default:
        top = "50%";
        left = "50%";
        transform = "translate(-50%, -50%)";
    }

    // Final bounds check
    if (typeof top === "number") {
      top = Math.max(80, Math.min(top, window.innerHeight - tooltipHeight - 20));
    }
    if (typeof left === "number") {
      left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));
    }

    setTooltipPosition({ 
      top: typeof top === "number" ? `${top}px` : top, 
      left: typeof left === "number" ? `${left}px` : left,
      transform 
    });
  }, [step]);

  // Update position on step change and window resize
  useEffect(() => {
    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    
    // Poll for element if waiting
    let pollInterval;
    if (waitingForElement) {
      pollInterval = setInterval(updateTooltipPosition, 200);
    }

    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [updateTooltipPosition, waitingForElement, currentStep]);

  // Highlight target element
  useEffect(() => {
    if (!step?.target) return;

    const element = document.querySelector(step.target);
    if (element) {
      // Store original styles
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;
      const originalBoxShadow = element.style.boxShadow;
      const originalBorderRadius = element.style.borderRadius;
      const originalBackground = element.style.background;
      
      element.style.position = "relative";
      element.style.zIndex = "101";
      element.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.4)";
      element.style.borderRadius = "12px";
      element.style.background = "rgba(30, 41, 59, 0.95)";
      
      return () => {
        element.style.position = originalPosition;
        element.style.zIndex = originalZIndex;
        element.style.boxShadow = originalBoxShadow;
        element.style.borderRadius = originalBorderRadius;
        element.style.background = originalBackground;
      };
    }
  }, [step, currentStep]);

  const handleNext = () => {
    // Handle actions when clicking Next
    if (step.actionOnNext === "openSettings") {
      if (onOpenSettings) onOpenSettings();
      // Small delay to let modal open, then advance
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 500);
      return;
    }

    if (step.actionOnNext === "closeSettings") {
      // First advance to the next step, then close settings after a delay
      setCurrentStep(prev => prev + 1);
      setTimeout(() => {
        if (onCloseSettings) onCloseSettings();
      }, 300);
      return;
    }

    if (step.actionOnNext === "clickGame") {
      // Find the first game card and click it
      const gameCardWrapper = document.querySelector("[data-tour='game-card']");
      if (gameCardWrapper) {
        const gameCard = gameCardWrapper.querySelector("[data-game-id]");
        if (gameCard) {
          // Mark that we should show gameDetail tour
          localStorage.setItem("findmyline_show_game_tour", "true");
          // Complete home tour
          if (onComplete) onComplete();
          // Click the game card
          gameCard.click();
          return;
        }
      }
    }

    if (step.actionOnNext === "selectBestBet") {
      // Find and click the first best odds cell (green highlighted)
      const bestOddsCell = document.querySelector("[data-tour='best-odds']");
      if (bestOddsCell) {
        bestOddsCell.click();
        // Small delay to let the bet slip update
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, 300);
        return;
      }
      // If no best odds found, just advance
      setCurrentStep(prev => prev + 1);
      return;
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.removeItem("findmyline_show_game_tour");
    if (onComplete) {
      onComplete();
    }
  };

  const handleNeverShow = () => {
    setIsVisible(false);
    localStorage.removeItem("findmyline_show_game_tour");
    if (onNeverShow) {
      onNeverShow();
    }
  };

  const handleSkip = () => {
    localStorage.removeItem("findmyline_show_game_tour");
    handleComplete();
  };

  if (!isVisible) return null;
  if (waitingForElement && !step.settingsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] pointer-events-none"
      >
        {/* Backdrop - lighter when settings modal is open */}
        <div 
          className={`absolute inset-0 pointer-events-auto ${
            step.lightBackdrop ? "bg-black/20" : "bg-black/70"
          }`}
          onClick={handleSkip} 
        />

        {/* Tour Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`pointer-events-auto w-[calc(100vw-32px)] sm:w-[90vw] max-w-sm z-[210] fixed ${
            tooltipPosition.isMobile 
              ? "bottom-4 left-4 right-4 mx-auto" 
              : ""
          }`}
          style={tooltipPosition.isMobile ? {} : {
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: tooltipPosition.transform || "translate(-50%, -50%)",
          }}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-5 pb-3 sm:pb-4">
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{step.description}</p>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 pb-3 sm:pb-5 flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                      idx === currentStep ? "bg-blue-500" : idx < currentStep ? "bg-blue-500/50" : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="text-slate-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-3"
                >
                  {isLastStep ? "Done" : step.actionOnNext === "clickGame" ? "View Game" : "Next"}
                  {!isLastStep && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />}
                </Button>
              </div>
              </div>

              {/* Never show again button */}
              <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-slate-700/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNeverShow}
                  className="w-full bg-transparent border-slate-500 text-white hover:bg-slate-700 hover:text-white text-xs sm:text-sm"
                >
                  Don&apos;t show this again
                </Button>
              </div>
            </div>

          {/* Arrow pointer */}
          {step.target && step.position !== "center" && (
            <div
              className={`absolute w-4 h-4 bg-slate-800 border-slate-700 rotate-45 ${
                step.position === "below" ? "-top-2 left-1/2 -translate-x-1/2 border-t border-l" :
                step.position === "above" ? "-bottom-2 left-1/2 -translate-x-1/2 border-b border-r" :
                step.position === "left" ? "-right-2 top-1/2 -translate-y-1/2 border-t border-r" :
                "-left-2 top-1/2 -translate-y-1/2 border-b border-l"
              }`}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
