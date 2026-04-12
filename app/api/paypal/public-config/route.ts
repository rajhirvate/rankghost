import { NextResponse } from "next/server";

/** Public client id for PayPal JS SDK — safe to expose; read at runtime so deploys always pick up env. */
export async function GET() {
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ||
    process.env.PAYPAL_CLIENT_ID?.trim() ||
    "";

  if (!clientId) {
    return NextResponse.json({ error: "PayPal client id not configured" }, { status: 503 });
  }

  return NextResponse.json({ clientId });
}
