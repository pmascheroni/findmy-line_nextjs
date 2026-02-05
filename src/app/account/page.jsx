"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Crown, Star, Loader2, Check, X, Gift, CreditCard, FileText, ExternalLink, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/components/subscription/SubscriptionContext";
import { useSettings, ALL_SPORTSBOOKS } from "@/components/settings/SettingsContext";
import { motion } from "framer-motion";
import PricingPlans from "@/components/subscription/PricingPlans";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebaseClient";

function TrialCountdown({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endDate);

      if (end <= now) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const totalHours = differenceInHours(end, now);
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = differenceInMinutes(end, now) % 60;

      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/40">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-5 h-5 text-purple-400" />
        <span className="font-semibold text-white">Friends & Family Free Trial</span>
      </div>
      <p className="text-sm text-slate-300 mb-3">
        You have exclusive free access to all premium features!
      </p>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-slate-400">Time remaining:</span>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-purple-500/30 rounded text-white text-sm font-medium">
            {timeLeft.days}d
          </span>
          <span className="px-2 py-1 bg-purple-500/30 rounded text-white text-sm font-medium">
            {timeLeft.hours}h
          </span>
          <span className="px-2 py-1 bg-purple-500/30 rounded text-white text-sm font-medium">
            {timeLeft.minutes}m
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const router = useRouter();
  const { user, userDoc: authUserDoc, loading: authLoading, updateProfileName } = useAuth();
  const { userDoc, isPaid, refreshSubscription } = useSubscription();
  const { selectedSportsbooks, addSportsbook, removeSportsbook } = useSettings();

  const [saving, setSaving] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in?redirect=/account");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.displayName || authUserDoc?.fullName || "");
    }
  }, [user, authUserDoc]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateProfileName(fullName);
      setMessage({ type: "success", text: "Name updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update name" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }

    setCancelLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to cancel subscription");
      setMessage({ type: "success", text: "Subscription cancelled. You'll retain access until the end of your billing period." });
      refreshSubscription();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to cancel subscription" });
    } finally {
      setCancelLoading(false);
    }
  };

  const toggleFavoriteBook = (bookKey) => {
    if (selectedSportsbooks.includes(bookKey)) {
      if (selectedSportsbooks.length > 1) {
        removeSportsbook(bookKey);
      }
    } else {
      addSportsbook(bookKey);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const subscriptionStatus = userDoc?.subscriptionStatus || "inactive";
  const subscriptionEnd =
    userDoc?.subscriptionPeriodEndDate ||
    userDoc?.subscriptionPeriodEnd?.toDate?.() ||
    (typeof userDoc?.subscriptionPeriodEnd === "string" ? new Date(userDoc.subscriptionPeriodEnd) : null) ||
    null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/" className="inline-flex">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Account Settings</h1>
        <p className="text-slate-400 mt-1">Manage your profile and subscription</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-2 ${
            message.type === "success" ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </motion.div>
      )}

      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="text-sm text-slate-400">Update your account details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
            <Input value={user.email || ""} disabled className="bg-slate-800 border-slate-700 text-white opacity-70" />
          </div>
          <Button onClick={handleSaveName} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Subscription</h2>
            <p className="text-sm text-slate-400">Manage your plan and billing</p>
          </div>
        </div>

        {userDoc?.inviteTokenId && subscriptionEnd && (
          <TrialCountdown endDate={subscriptionEnd} />
        )}

        {subscriptionStatus === "active" && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400 font-medium">Premium Active</p>
                {subscriptionEnd && (
                  <p className="text-xs text-slate-400">Renews on {format(subscriptionEnd, "MMMM d, yyyy")}</p>
                )}
              </div>
              <Crown className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        )}

        {subscriptionStatus !== "active" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Upgrade to unlock all premium features.</p>
            <PricingPlans />
          </div>
        )}

        {subscriptionStatus === "active" && (
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Subscription"}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Favorite Sportsbooks</h2>
            <p className="text-sm text-slate-400">Choose your preferred sportsbooks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_SPORTSBOOKS.slice(0, 10).map((book) => (
            <button
              key={book.key}
              onClick={() => toggleFavoriteBook(book.key)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedSportsbooks.includes(book.key)
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900/30 hover:bg-slate-800/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{book.name}</p>
                  <p className="text-xs text-slate-500">{book.region}</p>
                </div>
                {selectedSportsbooks.includes(book.key) && <Check className="w-4 h-4 text-blue-400" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
