import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { cancelSubscription } from "@/lib/paypal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace("Bearer ", "");
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  const decoded = await adminAuth.verifyIdToken(idToken);
  const userId = decoded.uid;

  const userSnap = await adminDb.collection("users").doc(userId).get();
  const subscriptionId = userSnap.data()?.paypalSubscriptionId as string | undefined;

  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  await cancelSubscription(subscriptionId);

  await adminDb.collection("users").doc(userId).update({
    plan: "free",
    subscriptionStatus: "cancelled",
    subscriptionCancelledAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
