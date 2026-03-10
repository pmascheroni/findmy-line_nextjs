import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

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

async function updateSubscriptionByCustomerId(customerId, data) {
  if (!customerId) return;
  const adminFirestore = getAdminFirestore();
  let snapshot = await adminFirestore
    .collection("Subscriptions")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    snapshot = await adminFirestore
      .collection("Subscriptions")
      .where("stripe_customer_id", "==", customerId)
      .limit(1)
      .get();
  }

  if (snapshot.empty) {
    console.warn("No subscription found for customer:", customerId);
    return;
  }

  const docRef = snapshot.docs[0].ref;
  await docRef.set(data, { merge: true });
}

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

async function reconcileCustomerSubscription(customerId, preferredSubscriptionId = null) {
  if (!customerId) return;

  const subscription = await getEffectiveSubscriptionForCustomer(customerId, preferredSubscriptionId);

  if (!subscription) {
    await updateSubscriptionByCustomerId(customerId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      subscriptionStatus: "inactive",
      subscriptionStatusRaw: "none",
      subscriptionCancelAtPeriodEnd: false,
      subscriptionPeriodEnd: null,
      stripe_customer_id: FieldValue.delete(),
      stripe_subscription_id: FieldValue.delete(),
      subscription_status: FieldValue.delete(),
      subscription_expires_at: FieldValue.delete(),
      subscription_cancel_at_period_end: FieldValue.delete(),
    });
    return;
  }

  const status = subscription.status || "inactive";
  const periodEnd = subscription.current_period_end
    ? Timestamp.fromMillis(subscription.current_period_end * 1000)
    : null;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId);

  await updateSubscriptionByCustomerId(customerId, {
    stripeCustomerId: subscription.customer || customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: ACTIVE_STATUSES.has(status) ? "active" : "inactive",
    subscriptionPeriodEnd: periodEnd,
    subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    subscriptionStatusRaw: status,
    ...(plan ? { subscriptionPlan: plan } : {}),
    stripe_customer_id: FieldValue.delete(),
    stripe_subscription_id: FieldValue.delete(),
    subscription_status: FieldValue.delete(),
    subscription_expires_at: FieldValue.delete(),
    subscription_cancel_at_period_end: FieldValue.delete(),
    ...(plan ? { subscription_plan: FieldValue.delete() } : {}),
  });
}

export async function POST(req) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.customer) {
          await reconcileCustomerSubscription(session.customer, session.subscription || null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await reconcileCustomerSubscription(subscription.customer, subscription.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.customer) {
          await reconcileCustomerSubscription(invoice.customer, invoice.subscription || null);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.customer) {
          await reconcileCustomerSubscription(invoice.customer, invoice.subscription || null);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
