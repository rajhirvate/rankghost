import { getPayPalAccessToken, PAYPAL_API } from "@/lib/paypal";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function createPlan(token: string, productId: string, name: string, interval: "MONTH" | "YEAR", value: string) {
  const res = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: interval, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value, currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  return (await res.json()) as { id: string };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getPayPalAccessToken();

  // Single product for all RankGhost plans
  const productRes = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "RankGhost",
      description: "AI-powered SERP rank tracking and AI citation monitoring",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const product = (await productRes.json()) as { id: string };
  const productId = product.id;

  // Starter: $9.99/mo · $95.88/yr ($7.99 × 12)
  const starterMonthly = await createPlan(token, productId, "RankGhost Starter – Monthly", "MONTH", "9.99");
  const starterAnnual  = await createPlan(token, productId, "RankGhost Starter – Annual",  "YEAR",  "95.88");

  // Pro: $24.99/mo · $239.88/yr ($19.99 × 12)
  const proMonthly = await createPlan(token, productId, "RankGhost Pro – Monthly", "MONTH", "24.99");
  const proAnnual  = await createPlan(token, productId, "RankGhost Pro – Annual",  "YEAR",  "239.88");

  // Agency: $69.99/mo · $671.88/yr ($55.99 × 12)
  const agencyMonthly = await createPlan(token, productId, "RankGhost Agency – Monthly", "MONTH", "69.99");
  const agencyAnnual  = await createPlan(token, productId, "RankGhost Agency – Annual",  "YEAR",  "671.88");

  return NextResponse.json({
    productId,
    starter: { monthly: starterMonthly.id, annual: starterAnnual.id },
    pro:     { monthly: proMonthly.id,     annual: proAnnual.id     },
    agency:  { monthly: agencyMonthly.id,  annual: agencyAnnual.id  },
    envVars: [
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_MONTHLY=${starterMonthly.id}`,
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_ANNUAL=${starterAnnual.id}`,
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_MONTHLY=${proMonthly.id}`,
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_ANNUAL=${proAnnual.id}`,
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_MONTHLY=${agencyMonthly.id}`,
      `NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_ANNUAL=${agencyAnnual.id}`,
    ],
  });
}
