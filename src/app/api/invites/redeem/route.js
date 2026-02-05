import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

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
    const inviteToken = body?.token;

    if (!inviteToken) {
      return NextResponse.json({ error: "Invite token required" }, { status: 400 });
    }

    const inviteRef = adminFirestore.collection("invites").doc(inviteToken);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const inviteData = inviteSnap.data();
    const expiresAt = inviteData.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    const alreadyRedeemed = inviteData.redeemedBy && inviteData.redeemedBy !== uid;
    if (alreadyRedeemed) {
      return NextResponse.json({ ok: true, already_redeemed: true, subscription_expires_at: expiresAt?.toISOString() || null });
    }

    if (!inviteData.redeemedBy) {
      await inviteRef.set(
        {
          redeemedBy: uid,
          redeemedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }

    const subscriptionRef = adminFirestore.collection("Subscriptions").doc(uid);
    await subscriptionRef.set(
      {
        subscriptionStatus: "active",
        subscription_status: "active",
        subscriptionPeriodEnd: inviteData.expiresAt || null,
        subscription_expires_at: inviteData.expiresAt || null,
        inviteTokenId: inviteToken,
        invite_token_id: inviteToken,
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      already_redeemed: !!inviteData.redeemedBy,
      subscription_expires_at: expiresAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Invite redeem error:", error);
    return NextResponse.json({ error: "Failed to redeem invite" }, { status: 500 });
  }
}
