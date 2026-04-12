export const PAYPAL_API =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PayPal token failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type PayPalSubscription = {
  id: string;
  status: string;
  plan_id: string;
  subscriber: {
    email_address: string;
    name: { given_name: string; surname: string };
  };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount: { value: string; currency_code: string }; time: string };
  };
};

export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch subscription: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<PayPalSubscription>;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason: "Customer requested cancellation" }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`Failed to cancel subscription: ${res.status}`);
  }
}
