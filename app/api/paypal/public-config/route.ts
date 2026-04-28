import { NextResponse } from "next/server";
import { env } from "@/lib/paypal";

/** Public client id for PayPal JS SDK — safe to expose; read at runtime so deploys always pick up env. */
export async function GET() {
  const clientId =
    env("NEXT_PUBLIC_PAYPAL_CLIENT_ID") ||
    env("PAYPAL_CLIENT_ID") ||
    "";

  if (!clientId) {
    return NextResponse.json({ error: "PayPal client id not configured" }, { status: 503 });
  }

  return NextResponse.json({ clientId });
}
