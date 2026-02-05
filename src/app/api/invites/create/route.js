import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
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
    const note = body?.note || null;

    const inviteToken = randomBytes(16).toString("hex");
    const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await adminFirestore.collection("invites").doc(inviteToken).set({
      token: inviteToken,
      note,
      createdAt: Timestamp.now(),
      createdBy: uid,
      expiresAt,
      redeemedBy: null,
      redeemedAt: null,
      remainingGlobalSlots: 1,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      invite_url: `${appUrl}/invite/${inviteToken}`,
      expires_at: expiresAt.toDate().toISOString(),
      remaining_global_slots: 1,
    });
  } catch (error) {
    console.error("Invite create error:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
