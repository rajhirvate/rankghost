"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, agency: 3 };

type Props = {
  planId: string;
  targetPlan: string; // "starter" | "pro" | "agency"
  label?: string;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> };
    };
  }
}

// Module-level mutex: all 3 plan buttons share this promise so the SDK is
// only injected once even when they all mount at the same time.
let sdkLoadPromise: Promise<void> | null = null;

function waitForPayPal(maxMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (typeof window !== "undefined" && window.paypal) { resolve(); return; }
      if (Date.now() - start > maxMs) {
        reject(new Error("PayPal took too long to load. Try refreshing or disabling ad blockers."));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function loadPayPalSdk(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.paypal) return Promise.resolve();

  if (!sdkLoadPromise) {
    sdkLoadPromise = (async () => {
      const id = clientId.trim();
      if (!id) throw new Error("PayPal is not configured.");

      const params = new URLSearchParams({
        "client-id": id,
        vault: "true",
        intent: "subscription",
        currency: "USD",
        components: "buttons",
      });

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Could not load PayPal (blocked or invalid Client ID). Disable ad blockers for this site or contact support."));
        document.head.appendChild(script);
      });

      await waitForPayPal(15000);
      if (!window.paypal) {
        throw new Error("PayPal SDK loaded but did not initialize. Your Client ID may be invalid for this environment.");
      }
    })();
  }

  return sdkLoadPromise;
}

export function PayPalSubscribeButton({ planId, targetPlan, label = "Subscribe" }: Props) {
  const { user, plan } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentRank = PLAN_RANK[plan] ?? 0;
  const targetRank  = PLAN_RANK[targetPlan] ?? 0;
  const alreadyOnPlan = currentRank >= targetRank && plan !== "free";

  useEffect(() => {
    if (!planId || alreadyOnPlan || !user || !containerRef.current) return;

    const el = containerRef.current;
    let destroyed = false;

    const run = async () => {
      setError(null);
      try {
        const cfgRes = await fetch("/api/paypal/public-config");
        const cfg = (await cfgRes.json()) as { clientId?: string; error?: string };
        if (!cfgRes.ok || !cfg.clientId) {
          throw new Error(cfg.error ?? "PayPal is not configured on the server.");
        }

        await loadPayPalSdk(cfg.clientId);
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
  }, [planId, alreadyOnPlan, user, router]);

  if (alreadyOnPlan) {
    const onExactPlan = plan === targetPlan;
    const displayPlan = plan.charAt(0).toUpperCase() + plan.slice(1);
    return (
      <div className="w-full rounded-full border border-[#39ff14]/40 py-3 text-sm font-bold text-[#39ff14] text-center">
        {onExactPlan ? `✓ You're on ${displayPlan}` : `✓ Included in your ${displayPlan} plan`}
      </div>
    );
  }

  if (!planId) return null;

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

  const displayTarget = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);

  return (
    <div className="w-full">
      {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
      {verifying && (
        <p className="text-[#39ff14] text-xs text-center mb-2 animate-pulse">Activating your {displayTarget} plan…</p>
      )}
      <div ref={containerRef} className="w-full min-h-[45px]" />
    </div>
  );
}
