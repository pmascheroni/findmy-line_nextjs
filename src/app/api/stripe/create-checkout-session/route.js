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

    const body = await req.json();
    const requestedPlan = String(body?.planId || body?.priceKey || "rookie").toLowerCase();
    const plan =
      requestedPlan === "amature"
        ? "amateur"
        : requestedPlan === "basic"
        ? "rookie"
        : requestedPlan;
    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRICE_PRO
        : plan === "amateur"
        ? process.env.STRIPE_PRICE_AMATEUR
        : plan === "rookie"
        ? process.env.STRIPE_PRICE_ROOKIE
        : null;

    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL not configured" }, { status: 500 });
    }

    const subscriptionRef = adminFirestore.collection("Subscriptions").doc(uid);
    const subscriptionSnap = await subscriptionRef.get();
    const subscriptionData = subscriptionSnap.exists ? subscriptionSnap.data() : {};

    let stripeCustomerId = subscriptionData?.stripeCustomerId || subscriptionData?.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: subscriptionData?.email || decoded.email || undefined,
        metadata: { uid },
      });
      stripeCustomerId = customer.id;
      await subscriptionRef.set(
        { stripeCustomerId, stripe_customer_id: stripeCustomerId },
        { merge: true }
      );
    }

    await subscriptionRef.set(
      { subscriptionPlan: plan, subscription_plan: plan },
      { merge: true }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
      metadata: { uid, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
