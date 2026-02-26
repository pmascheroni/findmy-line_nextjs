import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

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
          const plan = session.metadata?.plan;
          await updateSubscriptionByCustomerId(session.customer, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription || null,
            subscriptionStatus: "active",
            subscriptionPlan: plan || undefined,
            stripe_customer_id: FieldValue.delete(),
            stripe_subscription_id: FieldValue.delete(),
            subscription_status: FieldValue.delete(),
            ...(plan ? { subscription_plan: FieldValue.delete() } : {}),
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const status = subscription.status;
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

        await updateSubscriptionByCustomerId(subscription.customer, {
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: isActive ? "active" : "inactive",
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
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.customer) {
          await updateSubscriptionByCustomerId(invoice.customer, {
            stripeCustomerId: invoice.customer,
            subscriptionStatus: "active",
            subscription_status: FieldValue.delete(),
            stripe_customer_id: FieldValue.delete(),
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.customer) {
          await updateSubscriptionByCustomerId(invoice.customer, {
            stripeCustomerId: invoice.customer,
            subscriptionStatus: "inactive",
            subscription_status: FieldValue.delete(),
            stripe_customer_id: FieldValue.delete(),
          });
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
