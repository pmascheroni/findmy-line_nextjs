import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/AuthContext";

const SubscriptionContext = createContext(null);

async function ensureSubscriptionDoc(user) {
  if (!user || !db) return null;
  const ref = doc(db, "Subscriptions", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || null,
      createdAt: serverTimestamp(),
      subscriptionStatus: "inactive",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionPeriodEnd: null,
      subscriptionPlan: "free",
      subscriptionCancelAtPeriodEnd: false,
    });
  }
  return ref;
}

const normalizeSubscription = (data) => {
  if (!data) return null;
  const status = data.subscriptionStatus ?? data.subscription_status ?? "inactive";
  const plan = data.subscriptionPlan ?? data.subscription_plan ?? "free";
  const stripeCustomerId = data.stripeCustomerId ?? data.stripe_customer_id ?? null;
  const stripeSubscriptionId = data.stripeSubscriptionId ?? data.stripe_subscription_id ?? null;
  const rawPeriodEnd = data.subscriptionPeriodEnd ?? data.subscription_expires_at ?? null;
  const periodEndDate =
    rawPeriodEnd?.toDate?.() ||
    (typeof rawPeriodEnd === "string" ? new Date(rawPeriodEnd) : rawPeriodEnd instanceof Date ? rawPeriodEnd : null);
  const cancelAtPeriodEnd =
    data.subscriptionCancelAtPeriodEnd ?? data.subscription_cancel_at_period_end ?? false;
  const inviteTokenId = data.inviteTokenId ?? data.invite_token_id ?? null;

  return {
    ...data,
    subscriptionStatus: status,
    subscriptionPlan: plan,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionPeriodEnd: rawPeriodEnd,
    subscriptionPeriodEndDate: periodEndDate,
    subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
    inviteTokenId,
  };
};

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setUserDoc(null);
      setIsPaid(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "Subscriptions", user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          ensureSubscriptionDoc(user).catch(() => {});
        }
        const data = snap.exists() ? normalizeSubscription(snap.data()) : null;
        setUserDoc(data);
        const status = data?.subscriptionStatus || "inactive";
        const periodEnd = data?.subscriptionPeriodEndDate || null;
        const isActive = status === "active" || status === "trialing";
        const stillValid = periodEnd ? periodEnd > new Date() : true;
        setIsPaid(isActive && stillValid);
        setLoading(false);
      },
      () => {
        setUserDoc(null);
        setIsPaid(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refreshSubscription = () => {
    if (!user || !db) return;
    getDoc(doc(db, "Subscriptions", user.uid)).then((snap) => {
      if (!snap.exists()) {
        ensureSubscriptionDoc(user).catch(() => {});
      }
      const data = snap.exists() ? normalizeSubscription(snap.data()) : null;
      setUserDoc(data);
      const status = data?.subscriptionStatus || "inactive";
      const periodEnd = data?.subscriptionPeriodEndDate || null;
      const isActive = status === "active" || status === "trialing";
      const stillValid = periodEnd ? periodEnd > new Date() : true;
      setIsPaid(isActive && stillValid);
    });
  };

  return (
    <SubscriptionContext.Provider value={{ user, userDoc, loading, isPaid, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

export { SubscriptionContext };
