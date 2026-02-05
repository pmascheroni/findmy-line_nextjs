"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSubscription } from "@/components/subscription/SubscriptionContext";

export default function SuccessPage() {
  const { isPaid, refreshSubscription } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      refreshSubscription();
      if (attempts >= 6) {
        setChecking(false);
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [refreshSubscription]);

  useEffect(() => {
    if (isPaid) {
      setChecking(false);
    }
  }, [isPaid]);

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white">Payment successful!</h1>
      <p className="text-slate-400">Thank you for upgrading. Your subscription will activate shortly.</p>

      {checking && (
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Confirming subscription...</span>
        </div>
      )}

      {isPaid && (
        <p className="text-green-400 font-medium">Your premium access is now active.</p>
      )}

      <div className="flex items-center justify-center gap-3">
        <Link href="/account" className="text-blue-400 hover:text-blue-300">
          Go to Account
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          Back to Games
        </Link>
      </div>
    </div>
  );
}
