import { getPayPalAccessToken, PAYPAL_API } from "@/lib/paypal";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getPayPalAccessToken();

  // 1. Create product
  const productRes = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "RankGhost Pro",
      description: "AI-powered SERP rank tracking and AI citation monitoring",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const product = (await productRes.json()) as { id: string };
  const productId = product.id;

  // 2. Create monthly plan ($34.99/month)
  const monthlyRes = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name: "RankGhost Pro – Monthly",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: "34.99", currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  const monthly = (await monthlyRes.json()) as { id: string };

  // 3. Create annual plan ($299.88/year)
  const annualRes = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      name: "RankGhost Pro – Annual",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "YEAR", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: "299.88", currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  const annual = (await annualRes.json()) as { id: string };

  return NextResponse.json({
    productId,
    monthlyPlanId: monthly.id,
    annualPlanId: annual.id,
  });
}
