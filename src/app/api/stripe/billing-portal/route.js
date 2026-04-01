import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request) {
  try {
    const { authorization } = request.headers;
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In a real setup, you'd validate the Firebase token here
    // For now, we'll assume the token is valid and extract the user UID
    // You could decode the Firebase token using Firebase Admin SDK

    const stripeCustomerId = request.headers.get("x-stripe-customer-id");
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID not found" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[api/stripe/billing-portal]", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
