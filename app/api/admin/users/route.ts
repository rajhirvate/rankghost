import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getEffectivePlan } from "@/lib/pro-overrides";
import { PlanTier } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "rajhirvate@gmail.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace("Bearer ", "");
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
  if (!decoded || decoded.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminDb = getAdminDb();
  const snap = await adminDb.collection("users").get();

  // Fetch all Auth user records in batches of 100
  const uids = snap.docs.map((d) => d.id);
  const authEmailMap: Record<string, string> = {};
  for (let i = 0; i < uids.length; i += 100) {
    const batch = uids.slice(i, i + 100).map((uid) => ({ uid }));
    const result = await adminAuth.getUsers(batch);
    for (const u of result.users) {
      if (u.email) authEmailMap[u.uid] = u.email;
    }
  }

  const users = snap.docs.map((doc) => {
    const d = doc.data();
    const email = authEmailMap[doc.id] ?? d.email ?? null;
    const storedPlan = (d.plan ?? "free") as PlanTier;
    const plan = getEffectivePlan(storedPlan, email);
    return {
      uid: doc.id,
      email,
      plan,
      subscriptionStatus: d.subscriptionStatus ?? null,
      paypalSubscriptionId: d.paypalSubscriptionId ?? null,
      subscriptionActivatedAt: d.subscriptionActivatedAt ?? null,
      createdAt: d.createdAt ?? null,
    };
  });

  const planCounts: Record<string, number> = {};
  for (const u of users) {
    planCounts[u.plan] = (planCounts[u.plan] ?? 0) + 1;
  }

  return NextResponse.json({ users, planCounts, total: users.length });
}
