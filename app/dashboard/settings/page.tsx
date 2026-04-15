"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { user, plan, logout } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    if (!user || !window.confirm("Cancel your Pro subscription? You'll keep Pro until the end of the billing period.")) return;
    setCancelling(true);
    setCancelMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/paypal/cancel-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to cancel");
      }
      setCancelMsg("Subscription cancelled. Your plan will revert to Free.");
      setTimeout(() => router.refresh(), 2000);
    } catch (e) {
      setCancelMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCancelling(false);
    }
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FDFCFA]">
        <DashboardSidebar />
        <div className="flex-1 ml-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#FDFCFA]/80 backdrop-blur border-b border-black/[0.07]">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Link href="/dashboard" className="hover:text-[#39ff14] transition-colors">Dashboard</Link>
                <span>›</span>
                <span className="text-slate-800">Settings</span>
              </div>
              <h1 className="font-display text-xl font-normal text-slate-800">Settings</h1>
            </div>
          </header>

          <main className="px-8 py-8 max-w-2xl">

            {/* Profile */}
            <section className="mb-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">Profile</h2>
              <div className="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
                <div className="p-6 border-b border-black/[0.07] flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#39ff14]/10 border-2 border-[#39ff14]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-[#39ff14]">{initials}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{user?.email}</p>
                    <p className="text-sm text-slate-400 capitalize">{plan} plan · Member</p>
                  </div>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Display Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      defaultValue={user?.displayName ?? ""}
                      className="w-full rounded-lg border border-black/[0.07] bg-[#F5F5F0] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#39ff14]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user?.email ?? ""}
                      disabled
                      className="w-full rounded-lg border border-black/[0.07] bg-[#F5F5F0] px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400">Email cannot be changed here. Contact support if needed.</p>
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#39ff14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all"
                    >
                      Save Changes
                    </button>
                    {saved && <span className="text-sm text-[#39ff14] font-medium">Saved ✓</span>}
                  </div>
                </form>
              </div>
            </section>

            {/* Plan */}
            <section className="mb-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">Plan & Billing</h2>
              <div className="rounded-xl border border-black/[0.07] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-slate-800 capitalize">{plan} Plan</p>
                    <p className="text-sm text-slate-400">
                      {plan === "free" ? "10 keywords · Weekly checks · No AI citations"
                        : plan === "starter" ? "100 keywords · Daily checks · AI citations included"
                        : plan === "pro" ? "500 keywords · Daily checks · AI citations included"
                        : "2,000 keywords · Daily checks · AI citations included"}
                    </p>
                  </div>
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    plan !== "free"
                      ? "bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {plan}
                  </span>
                </div>
                {plan === "free" || plan === "starter" ? (
                  <Link
                    href="/#pricing"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#39ff14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Upgrade Plan
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {cancelMsg && (
                      <p className={`text-sm ${cancelMsg.includes("cancelled") ? "text-[#39ff14]" : "text-red-500"}`}>{cancelMsg}</p>
                    )}
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="rounded-lg border border-red-100 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling…" : "Cancel Subscription"}
                    </button>
                    <p className="text-xs text-slate-400">Want to switch plans? Cancel here, then resubscribe on the <Link href="/#pricing" className="underline underline-offset-2 hover:text-slate-600 transition-colors">pricing page</Link>.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Security */}
            <section className="mb-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">Security</h2>
              <div className="rounded-xl border border-black/[0.07] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Password</p>
                    <p className="text-xs text-slate-400">Change your account password</p>
                  </div>
                  <button className="rounded-lg border border-black/[0.07] px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-all">
                    Change Password
                  </button>
                </div>
                <div className="border-t border-black/[0.07] pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Sign out</p>
                    <p className="text-xs text-slate-400">Sign out from all sessions</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-500 hover:bg-red-100 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">Danger Zone</h2>
              <div className="rounded-xl border border-red-100 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Delete Account</p>
                    <p className="text-xs text-slate-400">Permanently delete your account and all data</p>
                  </div>
                  <button className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-all">
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
