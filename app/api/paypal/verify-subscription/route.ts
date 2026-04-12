import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getSubscription } from "@/lib/paypal";
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

  const { subscriptionId } = (await req.json()) as { subscriptionId?: string };
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  const subscription = await getSubscription(subscriptionId);

  if (subscription.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Subscription status is ${subscription.status}` },
      { status: 400 }
    );
  }

  await adminDb.collection("users").doc(userId).set(
    {
      plan: "pro",
      paypalSubscriptionId: subscriptionId,
      paypalPlanId: subscription.plan_id,
      subscriptionStatus: "active",
      subscriptionActivatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
