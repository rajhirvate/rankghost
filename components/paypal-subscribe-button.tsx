"use client";

import { useAuth } from "@/components/auth-provider";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  planId: string;
  label?: string;
};

export function PayPalSubscribeButton({ planId, label = "Subscribe" }: Props) {
  const { user, plan } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (!planId) return null;

  // Already Pro
  if (plan === "pro") {
    return (
      <div className="w-full rounded-full border border-[#39ff14]/40 py-3 text-sm font-bold text-[#39ff14] text-center">
        ✓ You&apos;re on Pro
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <button
        onClick={() => router.push("/signup")}
        className="font-display w-full rounded-full bg-[#39ff14] py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-[1.02] transition-all"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <p className="text-red-400 text-xs text-center mb-2">{error}</p>
      )}
      {verifying && (
        <p className="text-[#39ff14] text-xs text-center mb-2 animate-pulse">Activating your Pro plan…</p>
      )}
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          vault: true,
          intent: "subscription",
        }}
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: "subscribe",
            height: 45,
          }}
          createSubscription={(_data, actions) => {
            return actions.subscription.create({ plan_id: planId });
          }}
          onApprove={async (data) => {
            setVerifying(true);
            setError(null);
            try {
              const token = await user.getIdToken();
              const res = await fetch("/api/paypal/verify-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ subscriptionId: data.subscriptionID }),
              });
              if (!res.ok) {
                const body = (await res.json()) as { error?: string };
                throw new Error(body.error ?? "Verification failed");
              }
              router.push("/billing/success");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong. Please contact support.");
            } finally {
              setVerifying(false);
            }
          }}
          onError={() => setError("PayPal encountered an error. Please try again.")}
          onCancel={() => router.push("/billing/cancel")}
        />
      </PayPalScriptProvider>
    </div>
  );
}
