"use client";

import { useState } from "react";
import { collection, getDocs, getDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_SPORT = "americanfootball_nfl";
const TOP_SPORTS = [
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "basketball_nba",
  "basketball_ncaab",
  "baseball_mlb",
  "icehockey_nhl",
  "mma_mixed_martial_arts",
];
const DEFAULT_DATE = new Date().toISOString();

export default function TestPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const pushResult = (name, ok, details = "") => {
    setResults((prev) => [{ name, ok, details, ts: new Date().toISOString() }, ...prev]);
  };

  const runOddsTest = async () => {
    const url = `/api/odds?sports=${DEFAULT_SPORT}&marketsMode=0&sportsbooks=draftkings,fanduel`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      pushResult("Odds API", false, parsed?.error || text.slice(0, 200));
      return;
    }
    const count = Array.isArray(parsed?.games) ? parsed.games.length : 0;
    pushResult("Odds API", true, `games=${count}`);
  };

  const runSummaryTest = async () => {
    const tzOffset = new Date().getTimezoneOffset();
    const res = await fetch(
      `/api/sports/summary?date=${encodeURIComponent(DEFAULT_DATE)}&tzOffset=${tzOffset}`,
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      pushResult("Sports summary", false, data?.error || "Request failed");
      return;
    }
    const counts = data?.counts || {};
    const keys = Object.keys(counts).slice(0, 3).join(", ");
    pushResult("Sports summary", true, `keys=${keys || "none"}`);
  };

  const runOddsSportsTest = async () => {
    const res = await fetch(`/api/odds/sports`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      pushResult("Odds sports list", false, data?.error || "Request failed");
      return;
    }
    const count = Array.isArray(data?.sports) ? data.sports.length : 0;
    pushResult("Odds sports list", true, `sports=${count}`);
  };

  const runCompareTest = async () => {
    const tzOffset = new Date().getTimezoneOffset();
    const summaryRes = await fetch(
      `/api/sports/summary?date=${encodeURIComponent(DEFAULT_DATE)}&tzOffset=${tzOffset}`,
      { cache: "no-store" }
    );
    const summaryData = await summaryRes.json().catch(() => ({}));
    if (!summaryRes.ok) {
      pushResult("Compare ESPN vs Odds", false, summaryData?.error || "Summary failed");
      return;
    }

    const oddsRes = await fetch(
      `/api/odds?sports=${TOP_SPORTS.join(",")}&date=${encodeURIComponent(DEFAULT_DATE)}&marketsMode=0&sportsbooks=draftkings,fanduel&tzOffset=${tzOffset}`,
      { cache: "no-store" }
    );
    const oddsData = await oddsRes.json().catch(() => ({}));
    if (!oddsRes.ok) {
      pushResult("Compare ESPN vs Odds", false, oddsData?.error || "Odds failed");
      return;
    }

    const oddsCounts = TOP_SPORTS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    (oddsData.games || []).forEach((game) => {
      if (oddsCounts[game.sport_key] !== undefined) {
        oddsCounts[game.sport_key] += 1;
      }
    });

    TOP_SPORTS.forEach((sport) => {
      const espnCount = summaryData?.counts?.[sport] || 0;
      const oddsCount = oddsCounts[sport] || 0;
      const diff = oddsCount - espnCount;
      pushResult(
        `Compare ${sport}`,
        Math.abs(diff) <= 2,
        `odds=${oddsCount} espn=${espnCount} diff=${diff}`
      );
    });
  };

  const runStripeSyncTest = async () => {
    if (!user) {
      pushResult("Stripe sync", false, "Not signed in");
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushResult("Stripe sync", false, data?.error || "Request failed");
        return;
      }
      pushResult(
        "Stripe sync",
        true,
        `status=${data?.status || "unknown"} plan=${data?.plan || "n/a"}`
      );
    } catch (err) {
      pushResult("Stripe sync", false, err?.message || "error");
    }
  };

  const runTeamsTest = async () => {
    if (!db) {
      pushResult("Teams collection", false, "Firestore not initialized");
      return;
    }
    const collections = ["Team", "Teams", "teams"];
    for (const name of collections) {
      try {
        const snap = await getDocs(collection(db, name));
        if (!snap.empty) {
          pushResult("Teams collection", true, `${name} docs=${snap.size}`);
          return;
        }
      } catch (err) {
        pushResult("Teams collection", false, `${name}: ${err?.message || "error"}`);
      }
    }
    pushResult("Teams collection", false, "No docs found in Team/Teams/teams");
  };

  const inspectTeamDoc = async () => {
    if (!db) {
      pushResult("Team sample", false, "Firestore not initialized");
      return;
    }
    const collections = ["Team", "Teams", "teams"];
    for (const name of collections) {
      try {
        const snap = await getDocs(collection(db, name));
        const first = snap.docs[0];
        if (!first) continue;
        const data = first.data() || {};
        const keys = Object.keys(data);
        const logoFields = ["logo_url", "logoUrl", "logo", "logoURL", "logo_path"].filter(
          (k) => data[k]
        );
        const details = `from ${name} keys=${keys.slice(0, 8).join(", ")}${keys.length > 8 ? "…" : ""} logo=${logoFields.join("|") || "none"}`;
        pushResult("Team sample", true, details);
        return;
      } catch (err) {
        pushResult("Team sample", false, `${name}: ${err?.message || "error"}`);
      }
    }
    pushResult("Team sample", false, "No docs found in Team/Teams/teams");
  };

  const runSubscriptionDocTest = async () => {
    if (!db) {
      pushResult("Subscription doc", false, "Firestore not initialized");
      return;
    }
    if (!user) {
      pushResult("Subscription doc", false, "Not signed in");
      return;
    }
    try {
      const snap = await getDoc(doc(db, "Subscriptions", user.uid));
      if (!snap.exists()) {
        pushResult("Subscription doc", false, "Subscriptions/{uid} does not exist");
        return;
      }
      pushResult("Subscription doc", true, "Subscriptions/{uid} exists");
    } catch (err) {
      pushResult("Subscription doc", false, err?.message || "error");
    }
  };

  const createSubscriptionDoc = async () => {
    if (!db) {
      pushResult("Create subscription doc", false, "Firestore not initialized");
      return;
    }
    if (!user) {
      pushResult("Create subscription doc", false, "Not signed in");
      return;
    }
    try {
      await setDoc(doc(db, "Subscriptions", user.uid), {
        email: user.email || null,
        createdAt: serverTimestamp(),
        subscriptionStatus: "inactive",
        subscription_status: "inactive",
        stripeCustomerId: null,
        stripe_customer_id: null,
        stripeSubscriptionId: null,
        stripe_subscription_id: null,
        subscriptionPeriodEnd: null,
        subscription_expires_at: null,
        subscriptionPlan: "free",
        subscription_plan: "free",
        subscriptionCancelAtPeriodEnd: false,
        subscription_cancel_at_period_end: false,
      }, { merge: true });
      pushResult("Create subscription doc", true, "Subscriptions/{uid} created");
    } catch (err) {
      pushResult("Create subscription doc", false, err?.message || "error");
    }
  };

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    try {
      await runOddsTest();
      await runSummaryTest();
      await runOddsSportsTest();
      await runTeamsTest();
      await runSubscriptionDocTest();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6 text-white">
      <h1 className="text-2xl font-bold">Test Console</h1>
      <p className="text-slate-400 text-sm">
        Run targeted checks to validate API, Firestore, and auth without burning calls.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          {running ? "Running..." : "Run All"}
        </button>
        <button
          onClick={runOddsTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Test Odds API
        </button>
        <button
          onClick={runSummaryTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Test Sports Summary
        </button>
        <button
          onClick={runOddsSportsTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Test Odds Sports List
        </button>
        <button
          onClick={runCompareTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Compare ESPN vs Odds (Top Sports)
        </button>
        <button
          onClick={runStripeSyncTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Sync Stripe Subscription
        </button>
        <button
          onClick={runTeamsTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Test Teams Collection
        </button>
        <button
          onClick={inspectTeamDoc}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Inspect Team Doc
        </button>
        <button
          onClick={runSubscriptionDocTest}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Test Subscription Doc
        </button>
        <button
          onClick={createSubscriptionDoc}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60"
        >
          Create Subscription Doc
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-sm text-slate-400 mb-3">Latest results</div>
        {results.length === 0 ? (
          <div className="text-slate-500 text-sm">No results yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {results.map((r, idx) => (
              <li
                key={`${r.ts}-${idx}`}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${
                  r.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                }`}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs opacity-80">{r.details}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
