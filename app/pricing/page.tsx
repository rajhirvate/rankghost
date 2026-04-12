"use client";

import { useEffect } from "react";

/**
 * Pricing lives on the marketing homepage under #pricing.
 * This route exists so /pricing (bookmarks, old links, sidebar) never 404s.
 */
export default function PricingRedirectPage() {
  useEffect(() => {
    window.location.replace("/#pricing");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
      <div className="h-8 w-8 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin" />
      <p>Opening pricing…</p>
    </div>
  );
}
