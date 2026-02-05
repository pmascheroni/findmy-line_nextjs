"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import { SettingsProvider } from "@/components/settings/SettingsContext";
import { BetSlipProvider } from "@/components/game/BetSlipContext";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <SubscriptionProvider>
          <SettingsProvider>
            <BetSlipProvider>
              {children}
              <Toaster />
            </BetSlipProvider>
          </SettingsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
