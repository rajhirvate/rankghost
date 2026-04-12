import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getPayPalAccessToken, PAYPAL_API } from "@/lib/paypal";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return true; // skip verification until webhook ID is configured

  try {
    const token = await getPayPalAccessToken();
    const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        client_id: process.env.PAYPAL_CLIENT_ID,
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });
    const result = (await verifyRes.json()) as { verification_status: string };
    return result.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const valid = await verifySignature(req, body);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type: eventType, resource } = event;
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        const subscriptionId = resource.id as string;
        const planId = resource.plan_id as string;
        const subscriber = resource.subscriber as { email_address?: string };
        const email = subscriber?.email_address;
        if (!email) break;

        try {
          const userRecord = await adminAuth.getUserByEmail(email);
          await adminDb.collection("users").doc(userRecord.uid).set(
            {
              plan: "pro",
              paypalSubscriptionId: subscriptionId,
              paypalPlanId: planId,
              subscriptionStatus: "active",
              subscriptionActivatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log(`[webhook] activated pro for uid=${userRecord.uid}`);
        } catch (e) {
          console.error("[webhook] user not found for email:", email, e);
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subscriptionId = resource.id as string;
        const snap = await adminDb
          .collection("users")
          .where("paypalSubscriptionId", "==", subscriptionId)
          .limit(1)
          .get();

        if (!snap.empty) {
          const status =
            eventType === "BILLING.SUBSCRIPTION.CANCELLED" ? "cancelled" : "expired";
          await snap.docs[0].ref.update({
            plan: "free",
            subscriptionStatus: status,
            subscriptionEndedAt: new Date().toISOString(),
          });
          console.log(`[webhook] downgraded to free, status=${status}`);
        }
        break;
      }

      default:
        console.log("[webhook] unhandled event:", eventType);
    }
  } catch (error) {
    console.error("[paypal-webhook] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
