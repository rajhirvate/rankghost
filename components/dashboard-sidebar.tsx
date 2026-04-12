"use client";

import { useAuth } from "@/components/auth-provider";
import { getClientDb } from "@/lib/firebase";
import { PLAN_LIMITS } from "@/lib/plans";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const GHOST_PATH = "M12,4 C8.13401,4 5,7.13401 5,11 L5,19.6207 C5,19.9257 5.32764,20.1185 5.59426,19.9703 L6.53669,19.4468 C7.75977,18.7673 9.249,18.7762 10.4638,19.4704 L11.0077,19.7812 C11.6226,20.1326 12.3774,20.1326 12.9923,19.7812 L13.5362,19.4704 C14.751,18.7762 16.2402,18.7673 17.4633,19.4468 L18.4057,19.9703 C18.6724,20.1185 19,19.9257 19,19.6207 L19,11 C19,7.13401 15.866,4 12,4 Z M3,11 C3,6.02944 7.02944,2 12,2 C16.9706,2 21,6.02944 21,11 L21,19.6207 C21,21.4506 19.0341,22.6074 17.4345,21.7187 L16.492,21.1951 C15.8805,20.8553 15.1359,20.8598 14.5285,21.2069 L13.9846,21.5177 C12.7548,22.2204 11.2452,22.2204 10.0154,21.5177 L9.47154,21.2069 C8.86413,20.8598 8.11951,20.8553 7.50797,21.1951 L6.56554,21.7187 C4.96587,22.6074 3,21.4506 3,19.6207 L3,11 Z M10.5,10.5 C10.5,11.3284 9.82843,12 9,12 C8.17157,12 7.5,11.3284 7.5,10.5 C7.5,9.67157 8.17157,9 9,9 C9.82843,9 10.5,9.67157 10.5,10.5 Z M15,12 C15.8284,12 16.5,11.3284 16.5,10.5 C16.5,9.67157 15.8284,9 15,9 C14.1716,9 13.5,9.67157 13.5,10.5 C13.5,11.3284 14.1716,12 15,12 Z";

const nav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    exact: false,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    exact: false,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardSidebar() {
  const { user, plan, logout } = useAuth();
  const pathname = usePathname();
  const [keywordCount, setKeywordCount] = useState(0);

  const keywordLimit = PLAN_LIMITS[plan]?.keywords ?? 5;
  const initials = user?.email?.[0]?.toUpperCase() ?? "U";
  const usagePct = Math.min((keywordCount / keywordLimit) * 100, 100);

  useEffect(() => {
    if (!user) return;
    const db = getClientDb();
    const load = async () => {
      const projects = await getDocs(collection(db, "users", user.uid, "projects"));
      let total = 0;
      for (const p of projects.docs) {
        const kws = await getDocs(collection(db, "users", user.uid, "projects", p.id, "keywords"));
        total += kws.size;
      }
      setKeywordCount(total);
    };
    load().catch(console.error);
  }, [user]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-[#0d0d0d] border-r border-white/[0.06] z-40">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <svg className="h-7 w-7 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" viewBox="0 0 24 24" fill="none">
            <path d={GHOST_PATH} fill="currentColor" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold text-white">RankGhost</span>
            <span className="text-[9px] text-white/30 tracking-wide">AI-Powered SEO</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href === "/dashboard/projects" ? "/dashboard/projects/new" : item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#39ff14]/10 text-[#39ff14]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#39ff14] rounded-r-full" />
              )}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan card */}
      <div className="mx-3 mb-3 rounded-xl bg-white/[0.05] border border-white/[0.09] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white capitalize">{plan} Plan</span>
          <span className="rounded-full bg-[#39ff14]/15 border border-[#39ff14]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#39ff14]">{plan}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/60">Keywords used</p>
          <p className="text-xs font-semibold text-white">{keywordCount} / {keywordLimit}</p>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.08] mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#39ff14] transition-all duration-700"
            style={{ width: `${usagePct}%` }}
          />
        </div>
        {plan === "free" && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20 py-2 text-xs font-semibold text-[#39ff14] hover:bg-[#39ff14]/20 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Usage stats */}
      <div className="mx-3 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
        {[
          {
            label: "Check Frequency",
            value: "24h / keyword",
            icon: (
              <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "AI Citations",
            value: plan === "pro" ? "Unlocked" : "Pro only",
            icon: (
              <svg className={`h-3 w-3 ${plan === "pro" ? "text-[#39ff14]" : "text-white/30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {plan === "pro"
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
              </svg>
            ),
          },
          {
            label: "SERP Depth",
            value: "Top 100 results",
            icon: (
              <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ),
          },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              {row.icon}
              <span className="text-[10px] text-white/40">{row.label}</span>
            </div>
            <span className={`text-[10px] font-semibold ${row.label === "AI Citations" && plan === "pro" ? "text-[#39ff14]" : "text-white/70"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/[0.08] pt-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#39ff14]/20 border border-[#39ff14]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#39ff14]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">{user?.email}</p>
            <p className="text-[10px] text-white/50 capitalize">{plan} plan</p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
