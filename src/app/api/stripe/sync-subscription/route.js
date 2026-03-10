import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const STATUS_PRIORITY = {
  active: 0,
  trialing: 1,
  past_due: 2,
  unpaid: 3,
  incomplete: 4,
  incomplete_expired: 5,
  paused: 6,
  canceled: 7,
};

const getPlanFromPriceId = (priceId) =>
  priceId === process.env.STRIPE_PRICE_PRO
    ? "pro"
    : priceId === process.env.STRIPE_PRICE_AMATEUR
    ? "amateur"
    : priceId === process.env.STRIPE_PRICE_ROOKIE
    ? "rookie"
    : undefined;

async function getEffectiveSubscriptionForCustomer(customerId, preferredSubscriptionId = null) {
  if (!customerId) return null;

  const subscriptions = [];
  let startingAfter = undefined;

  while (subscriptions.length < 25) {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    subscriptions.push(...(list.data || []));
    if (!list.has_more || !list.data?.length) break;
    startingAfter = list.data[list.data.length - 1].id;
  }

  if (!subscriptions.length) return null;

  const uniqueSubscriptions = Array.from(new Map(subscriptions.map((sub) => [sub.id, sub])).values());

  uniqueSubscriptions.sort((a, b) => {
    const aPreferred = preferredSubscriptionId && a.id === preferredSubscriptionId ? 1 : 0;
    const bPreferred = preferredSubscriptionId && b.id === preferredSubscriptionId ? 1 : 0;
    if (aPreferred !== bPreferred) return bPreferred - aPreferred;

    const aPriority = STATUS_PRIORITY[a.status] ?? 99;
    const bPriority = STATUS_PRIORITY[b.status] ?? 99;
    if (aPriority !== bPriority) return aPriority - bPriority;

    return (b.created || 0) - (a.created || 0);
  });

  return uniqueSubscriptions[0];
}

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminFirestore = getAdminFirestore();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const subscriptionRef = adminFirestore.collection("Subscriptions").doc(uid);
    const subscriptionSnap = await subscriptionRef.get();
    const subscriptionData = subscriptionSnap.exists ? subscriptionSnap.data() : {};

    const stripeCustomerId =
      subscriptionData?.stripeCustomerId || subscriptionData?.stripe_customer_id || null;
    const subscriptionId =
      subscriptionData?.stripeSubscriptionId || subscriptionData?.stripe_subscription_id || null;

    const subscription = await getEffectiveSubscriptionForCustomer(stripeCustomerId, subscriptionId);

    if (!subscription) {
      return NextResponse.json({ error: "No Stripe subscription found" }, { status: 404 });
    }

    const status = subscription.status || "inactive";
    const isActive = ACTIVE_STATUSES.has(status);
    const periodEnd = subscription.current_period_end
      ? Timestamp.fromMillis(subscription.current_period_end * 1000)
      : null;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plan = getPlanFromPriceId(priceId);
    const existingPlan = subscriptionData?.subscriptionPlan || subscriptionData?.subscription_plan || null;
    const normalizedPlan = plan || existingPlan || null;

    const normalizedCustomerId = subscription.customer || stripeCustomerId || null;

    await subscriptionRef.set(
      {
        stripeCustomerId: normalizedCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: isActive ? "active" : "inactive",
        subscriptionStatusRaw: status,
        subscriptionPeriodEnd: periodEnd,
        subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        ...(normalizedPlan ? { subscriptionPlan: normalizedPlan } : {}),
        stripe_customer_id: FieldValue.delete(),
        stripe_subscription_id: FieldValue.delete(),
        subscription_status: FieldValue.delete(),
        subscription_expires_at: FieldValue.delete(),
        subscription_cancel_at_period_end: FieldValue.delete(),
        ...(normalizedPlan ? { subscription_plan: FieldValue.delete() } : {}),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      status,
      plan: plan || null,
      current_period_end: subscription.current_period_end || null,
      subscription_id: subscription.id,
      customer_id: normalizedCustomerId,
    });
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 });
  }
}
