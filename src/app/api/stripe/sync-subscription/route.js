import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

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
    let subscriptionId =
      subscriptionData?.stripeSubscriptionId || subscriptionData?.stripe_subscription_id || null;

    let subscription = null;
    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (stripeCustomerId) {
      const list = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 1,
      });
      subscription = list.data?.[0] || null;
      subscriptionId = subscription?.id || null;
    }

    if (!subscription) {
      return NextResponse.json({ error: "No Stripe subscription found" }, { status: 404 });
    }

    const status = subscription.status || "inactive";
    const isActive = status === "active" || status === "trialing";
    const periodEnd = subscription.current_period_end
      ? Timestamp.fromMillis(subscription.current_period_end * 1000)
      : null;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plan =
      priceId === process.env.STRIPE_PRICE_PRO
        ? "pro"
        : priceId === process.env.STRIPE_PRICE_AMATEUR
        ? "amateur"
        : priceId === process.env.STRIPE_PRICE_ROOKIE
        ? "rookie"
        : undefined;
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
