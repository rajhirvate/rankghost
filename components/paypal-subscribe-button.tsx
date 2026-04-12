"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  planId: string;
  label?: string;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> };
    };
  }
}

function findPayPalSdkScript(): HTMLScriptElement | undefined {
  return Array.from(document.querySelectorAll("script")).find((s) =>
    s.src.includes("paypal.com/sdk/js")
  ) as HTMLScriptElement | undefined;
}

function loadPayPalSdk(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.paypal) return Promise.resolve();

  const existing = findPayPalSdkScript();
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PayPal script failed")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      vault: "true",
      intent: "subscription",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
}

export function PayPalSubscribeButton({ planId, label = "Subscribe" }: Props) {
  const { user, plan } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!planId || plan === "pro" || !user || !containerRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal is not configured.");
      return;
    }

    const el = containerRef.current;
    let destroyed = false;

    const run = async () => {
      setError(null);
      try {
        await loadPayPalSdk(clientId);
        if (destroyed || !el.isConnected) return;
        const paypal = window.paypal;
        if (!paypal) {
          setError("PayPal failed to initialize.");
          return;
        }

        el.innerHTML = "";
        await paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "pill",
              label: "subscribe",
              height: 45,
            },
            createSubscription: (_data: unknown, actions: { subscription: { create: (o: { plan_id: string }) => Promise<string> } }) =>
              actions.subscription.create({ plan_id: planId }),
            onApprove: async (data: { subscriptionID?: string }) => {
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
            },
            onError: () => setError("PayPal encountered an error. Please try again."),
            onCancel: () => router.push("/billing/cancel"),
          })
          .render(el);
      } catch (e) {
        if (!destroyed) setError(e instanceof Error ? e.message : "Failed to load PayPal.");
      }
    };

    void run();

    return () => {
      destroyed = true;
      el.innerHTML = "";
    };
  }, [planId, plan, user, router]);

  if (!planId) return null;

  if (plan === "pro") {
    return (
      <div className="w-full rounded-full border border-[#39ff14]/40 py-3 text-sm font-bold text-[#39ff14] text-center">
        ✓ You&apos;re on Pro
      </div>
    );
  }

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
      {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
      {verifying && (
        <p className="text-[#39ff14] text-xs text-center mb-2 animate-pulse">Activating your Pro plan…</p>
      )}
      <div ref={containerRef} className="w-full min-h-[45px]" />
    </div>
  );
}
