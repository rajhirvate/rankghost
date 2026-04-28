import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { env, getSubscription } from "@/lib/paypal";
import { PlanTier } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function tierFromPlanId(planId: string): PlanTier {
  const id = planId.trim();
  if (id === env("NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_MONTHLY") || id === env("NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_ANNUAL")) return "starter";
  if (id === env("NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_MONTHLY")  || id === env("NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_ANNUAL"))  return "agency";
  return "pro";
}

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

  // APPROVED = user just approved in PayPal UI; ACTIVE = payment processed.
  // onApprove fires at APPROVED; ACTIVE arrives via webhook shortly after.
  if (!["ACTIVE", "APPROVED"].includes(subscription.status)) {
    return NextResponse.json(
      { error: `Subscription status is ${subscription.status}` },
      { status: 400 }
    );
  }

  const tier = tierFromPlanId(subscription.plan_id);

  await adminDb.collection("users").doc(userId).set(
    {
      plan: tier,
      paypalSubscriptionId: subscriptionId,
      paypalPlanId: subscription.plan_id,
      subscriptionStatus: "active",
      subscriptionActivatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
