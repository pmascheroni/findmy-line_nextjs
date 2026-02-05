import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

export async function POST(req) {
  try {
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

    let subscriptionId = subscriptionData?.stripeSubscriptionId || subscriptionData?.stripe_subscription_id;

    const stripeCustomerId =
      subscriptionData?.stripeCustomerId || subscriptionData?.stripe_customer_id;
    if (!subscriptionId && stripeCustomerId) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 1,
      });
      subscriptionId = subs.data?.[0]?.id;
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await subscriptionRef.set(
      {
        subscriptionCancelAtPeriodEnd: true,
        subscription_cancel_at_period_end: true,
        stripeSubscriptionId: subscription.id,
        stripe_subscription_id: subscription.id,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
