"use client";

import { FaqAccordion } from "@/components/faq-accordion";
import { LandingNav } from "@/components/landing-nav";
import { PayPalSubscribeButton } from "@/components/paypal-subscribe-button";
import { TiltCard } from "@/components/tilt-card";
import Link from "next/link";
import { useState } from "react";

/* ─── data ─────────────────────────────────────────────────── */

const everythingFeatures = [
  { title: "Exact SERP Position", desc: "1-based rank across 100 Google results with root-domain matching.", icon: "🎯" },
  { title: "AI Citation Status", desc: "See if ChatGPT & AI engines cite your domain for the keyword.", icon: "🤖" },
  { title: "Rank History Charts", desc: "Sparklines show movement across your last 10 checks at a glance.", icon: "📈" },
  { title: "Multi-Project Support", desc: "Manage multiple clients or sites from one account.", icon: "📁" },
  { title: "Bulk Parallel Checks", desc: "Run all keywords simultaneously — no waiting in line.", icon: "🚀" },
  { title: "Rank Change Delta", desc: "See exactly how many positions you gained or lost per check.", icon: "📉" },
];

const objections = [
  { q: "Can't I just use Google Search Console?", a: "GSC is great for owned data but it's delayed by days and doesn't show exact live rankings across 100 results — or tell you if ChatGPT is citing your domain." },
  { q: "Is the rank data actually live?", a: "Yes. Every check hits Apify's Google Search Scraper in real-time and returns fresh SERP data — not cached results." },
  { q: "What if my site isn't in the top 100?", a: "We scan 10 pages × 10 results = 100 positions. If you're not found, we return 'Not found' so you know exactly where you stand." },
  { q: "Do I need to know how to code?", a: "Not at all. RankGhost is a no-code dashboard. Create a project, add keywords, click Run Check." },
  { q: "Is the free plan actually useful?", a: "Yes — 10 keywords, weekly SERP tracking, rank history charts. No credit card required. It's a real product, not a teaser." },
];

const plans = [
  {
    label: "For Freelancers & Solos",
    name: "Starter",
    tier: "starter",
    monthly: { price: "9",  cents: ".99", note: "Billed monthly · No commitment",    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_MONTHLY ?? "" },
    yearly:  { price: "7",  cents: ".99", note: "Billed annually · Save $24/yr",     planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER_ANNUAL  ?? "" },
    features: ["100 keywords", "Daily SERP rank tracking (top 100)", "AI citation monitoring", "Rank history charts"],
    cta: "Get Started",
    featured: false,
  },
  {
    label: "For Growing Teams",
    name: "Pro",
    tier: "pro",
    monthly: { price: "24", cents: ".99", note: "Billed monthly · No commitment",    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_MONTHLY ?? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY ?? "" },
    yearly:  { price: "19", cents: ".99", note: "Billed annually · Save $60/yr",     planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_ANNUAL  ?? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ANNUAL  ?? "" },
    features: ["500 keywords", "Daily SERP rank tracking (top 100)", "AI citation monitoring", "Bulk parallel checks", "Multi-project dashboard", "Priority support"],
    cta: "Get Started",
    featured: true,
  },
  {
    label: "For Agencies",
    name: "Agency",
    tier: "agency",
    monthly: { price: "69", cents: ".99", note: "Billed monthly · No commitment",    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_MONTHLY ?? "" },
    yearly:  { price: "55", cents: ".99", note: "Billed annually · Save $168/yr",    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_ANNUAL  ?? "" },
    features: ["2,000 keywords", "Everything in Pro", "White-label reports", "Dedicated account manager"],
    cta: "Get Started",
    featured: false,
  },
];

/* ─── page ──────────────────────────────────────────────────── */

export default function Home() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-200">
      <LandingNav />

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center px-4 sm:px-6 pt-28 pb-6 md:pt-36 bg-[#050505] rounded-b-[2rem] md:rounded-b-[3rem]">
        {/* Green radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[600px] md:h-[600px] md:w-[900px] rounded-full bg-[#39ff14]/25 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[200px] w-[300px] md:h-[300px] md:w-[400px] rounded-full bg-[#39ff14]/30 blur-[80px]" />
        </div>

        {/* Badge */}
        <div className="relative z-10 mb-8 inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-2 sm:px-5 border border-white/10">
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#39ff14]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-300">Latest feature just launched</span>
        </div>

        {/* Heading */}
        <div className="relative z-10 mx-auto max-w-4xl text-center w-full">
          <h1 className="font-display font-normal leading-[1.1] tracking-tight">
            <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] text-white">Does AI</span>
            <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] green-gradient-text">know you exist?</span>
          </h1>

          <p className="mx-auto mt-6 sm:mt-8 max-w-lg text-sm sm:text-base leading-relaxed text-white md:text-lg">
            Know where you rank. Know when AI cites you.
          </p>

          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-white/60">
            Your brand in Google. Your brand in AI. We track both.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="font-display inline-block w-full sm:w-auto rounded-full bg-[#39ff14] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(57,255,20,0.4)] transition-all hover:scale-105 active:scale-95 text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="font-display inline-block w-full sm:w-auto rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-95 text-center"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <TiltCard className="relative z-10 mt-12 sm:mt-16 w-full max-w-6xl mx-auto">
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-20 bg-gradient-to-t from-[#050505] to-transparent" />
          <div className="relative rounded-[16px] sm:rounded-[24px] border border-white/10 bg-[#0e0e0e] overflow-hidden shadow-[0_-20px_80px_rgba(57,255,20,0.08)]">
            {/* Top bar */}
            <div className="flex items-center gap-2 sm:gap-4 border-b border-white/5 bg-[#0a0a0a] px-3 sm:px-6 py-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-[#39ff14]/20 border border-[#39ff14]/30 flex items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-[#39ff14]">R</span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">RANKGHOST</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-6">
                <span className="text-[10px] text-slate-500">Selected Site:</span>
                <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1">
                  <span className="text-xs text-white font-medium">mysite.com</span>
                  <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <button className="hidden sm:block ml-2 rounded-md bg-[#39ff14] px-3 py-1 text-[10px] font-bold text-black shrink-0">+ Add new site</button>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white/10 border border-white/20 shrink-0" />
                <div className="hidden sm:block">
                  <div className="text-[10px] font-bold text-white leading-none">Raj H.</div>
                  <div className="text-[9px] text-[#39ff14] leading-none mt-0.5">Pro Member</div>
                </div>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="grid md:grid-cols-[180px_1fr] min-h-[300px] sm:min-h-[420px]">
              <div className="hidden border-r border-white/5 md:flex flex-col gap-1 p-4">
                {[
                  { label: "Dashboard", active: true },
                  { label: "Keywords", active: false },
                  { label: "Projects", active: false },
                  { label: "AI Citations", active: false },
                  { label: "Settings", active: false },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${item.active ? "bg-[#39ff14]/10 border border-[#39ff14]/20" : ""}`}>
                    <div className={`h-3 w-3 rounded-sm ${item.active ? "bg-[#39ff14]" : "bg-white/10"}`} />
                    <span className={`text-xs font-medium ${item.active ? "text-[#39ff14]" : "text-slate-500"}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: "Unique Visitors", value: "34,521", trend: "+12%" },
                    { label: "Avg. SERP Rank", value: "#14.3", trend: "↑ 3" },
                    { label: "AI Citations", value: "8 / 20", trend: "cited" },
                    { label: "SEO Health", value: "95%", trend: "↑" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/5 bg-[#111] p-2.5 sm:p-4">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mb-1 truncate">{stat.label}</p>
                      <p className="text-sm sm:text-lg font-black text-white leading-none">{stat.value}</p>
                      <p className="text-[9px] sm:text-[10px] text-[#39ff14] mt-1">{stat.trend}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/5 bg-[#111] overflow-hidden">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/5">
                    <span className="text-[11px] sm:text-xs font-bold text-white">Keyword Rankings</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500">Last checked: just now</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[360px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Keyword", "SERP Rank", "Change", "AI Citation"].map(h => (
                            <th key={h} className="px-3 sm:px-5 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { kw: "hostinger review", rank: "#4", change: "+2", ai: "cited" },
                          { kw: "best web hosting 2024", rank: "#11", change: "-1", ai: "not_found" },
                          { kw: "cheap vps hosting", rank: "#7", change: "+5", ai: "cited" },
                          { kw: "wordpress hosting plans", rank: "#19", change: "–", ai: "not_found" },
                        ].map((row) => (
                          <tr key={row.kw} className="border-b border-white/[0.03]">
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs text-white font-medium">{row.kw}</td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs text-[#39ff14] font-bold">{row.rank}</td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs text-slate-400">{row.change}</td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3">
                              <span className={`rounded-full px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold ${row.ai === "cited" ? "bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20" : "bg-white/5 text-slate-500 border border-white/5"}`}>
                                {row.ai === "cited" ? "Cited" : "Not found"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </section>

      {/* ══ FEATURES BENTO ═════════════════════════════════════════ */}
      <section id="features" className="pt-12 pb-10 relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="max-w-xl text-left">
              <h2 className="font-display text-3xl sm:text-4xl font-normal text-slate-900 md:text-5xl leading-[1.05]">
                Our Features <br /> you will get
              </h2>
            </div>
            <p className="max-w-md text-slate-500 text-sm sm:text-base leading-relaxed">
              Track your Google rankings and AI citations in real time. Know exactly where your brand stands — in search and in AI.
            </p>
            <Link href="/signup" className="font-display rounded-full bg-[#39ff14] px-6 py-2.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(57,255,20,0.5)] hover:scale-105 transition-all active:scale-95 shrink-0">See All Features</Link>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {everythingFeatures.map((f) => (
              <div
                key={f.title}
                className="group relative bg-slate-50 rounded-[28px] sm:rounded-[40px] p-7 sm:p-10 border border-slate-200 hover:border-[#39ff14]/40 overflow-hidden transition-all duration-500 flex flex-col justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#39ff14]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight">{f.title}</h3>
                </div>
                <p className="relative z-10 text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════ */}
      <section id="pricing" className="pt-14 pb-6 relative bg-[#050505]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#39ff14]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-white mb-3 leading-[1.05]">Simple, transparent pricing</h2>
            <p className="text-slate-500 text-sm mb-8">No hidden fees. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 mb-3">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Annual
                <span className="bg-[#39ff14] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">Save 25%</span>
              </button>
            </div>
            <div>
              <button className="text-xs text-slate-500 hover:text-[#39ff14] transition-colors underline underline-offset-2">Have a coupon? Redeem here</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {plans.map((plan) => {
              const pricing = isYearly ? plan.yearly : plan.monthly;
              return (
                <div
                  key={plan.name}
                  className={`rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border flex flex-col relative ${
                    plan.featured
                      ? "border-[#39ff14]/20 bg-[#0f0f0f] shadow-[0_0_60px_rgba(57,255,20,0.08)]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#39ff14] text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">Most Popular</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest">{plan.label}</p>
                  <h4 className="font-display text-2xl font-normal text-white mb-4">{plan.name}</h4>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`font-sans text-4xl sm:text-5xl font-light leading-none ${plan.featured ? "text-[#39ff14]" : "text-white"}`}>
                      ${pricing.price}
                    </span>
                    <span className={`font-sans text-2xl sm:text-3xl font-light leading-none mb-0.5 ${plan.featured ? "text-[#39ff14]" : "text-white"}`}>
                      {pricing.cents}
                    </span>
                    <span className="text-slate-500 text-sm mb-1">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 sm:mb-8">{pricing.note}</p>
                  <ul className="space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map(item => (
                      <li key={item} className={`flex items-center gap-3 text-sm ${plan.featured ? "text-white" : "text-slate-400"}`}>
                        <span className="text-[#39ff14] text-base shrink-0">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <PayPalSubscribeButton
                    planId={isYearly ? plan.yearly.planId : plan.monthly.planId}
                    targetPlan={plan.tier}
                    label={plan.cta}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Free plan ─────────────────────────────────────────── */}
          <div className="mt-5 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Free</span>
                <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full font-medium">No credit card</span>
              </div>
              <p className="text-white font-display text-lg font-normal leading-snug mb-2">Start tracking for free</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {["10 keywords", "Weekly SERP rank tracking", "Rank history charts"].map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[#39ff14]/70">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/signup"
              className="shrink-0 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-all whitespace-nowrap"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 sm:py-32 bg-[#080808]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-white mb-4 leading-[1.05]">Frequent Ask Questions</h2>
            <p className="text-slate-500 text-sm">Grow your research through impactful, smart questions and seamless tools that help you reach further than ever before.</p>
          </div>
          <FaqAccordion faqs={objections} />
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="pt-12 sm:pt-16 pb-10 bg-[#050505] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10 sm:gap-12 mb-12 sm:mb-16">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <svg className="h-7 w-7 text-[#39ff14]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12,4 C8.13401,4 5,7.13401 5,11 L5,19.6207 C5,19.9257 5.32764,20.1185 5.59426,19.9703 L6.53669,19.4468 C7.75977,18.7673 9.249,18.7762 10.4638,19.4704 L11.0077,19.7812 C11.6226,20.1326 12.3774,20.1326 12.9923,19.7812 L13.5362,19.4704 C14.751,18.7762 16.2402,18.7673 17.4633,19.4468 L18.4057,19.9703 C18.6724,20.1185 19,19.9257 19,19.6207 L19,11 C19,7.13401 15.866,4 12,4 Z M3,11 C3,6.02944 7.02944,2 12,2 C16.9706,2 21,6.02944 21,11 L21,19.6207 C21,21.4506 19.0341,22.6074 17.4345,21.7187 L16.492,21.1951 C15.8805,20.8553 15.1359,20.8598 14.5285,21.2069 L13.9846,21.5177 C12.7548,22.2204 11.2452,22.2204 10.0154,21.5177 L9.47154,21.2069 C8.86413,20.8598 8.11951,20.8553 7.50797,21.1951 L6.56554,21.7187 C4.96587,22.6074 3,21.4506 3,19.6207 L3,11 Z M10.5,10.5 C10.5,11.3284 9.82843,12 9,12 C8.17157,12 7.5,11.3284 7.5,10.5 C7.5,9.67157 8.17157,9 9,9 C9.82843,9 10.5,9.67157 10.5,10.5 Z M15,12 C15.8284,12 16.5,11.3284 16.5,10.5 C16.5,9.67157 15.8284,9 15,9 C14.1716,9 13.5,9.67157 13.5,10.5 C13.5,11.3284 14.1716,12 15,12 Z" fill="currentColor"/>
                </svg>
                <span className="font-display text-lg font-bold text-white">RankGhost</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Track your SERP rankings and AI citations in real time. Know where your brand stands.
              </p>
              {/* Secured by badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1">Secured by</span>
                {/* PayPal */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1">
                  <span className="text-[11px] font-bold text-white leading-none">Pay</span>
                  <span className="text-[11px] font-bold text-slate-300 leading-none">Pal</span>
                </div>
                {/* SSL */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1">
                  <svg className="h-3 w-3 text-[#39ff14]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                  <span className="text-[10px] text-white font-medium">SSL</span>
                </div>
                {/* Visa */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-1">
                  <span className="text-[11px] font-bold text-white tracking-wider leading-none">VISA</span>
                </div>
                {/* Mastercard */}
                <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded px-2 py-1">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
                  <div className="h-3.5 w-3.5 rounded-full bg-[#f79e1b] -ml-1.5" />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
              <div>
                <h5 className="text-white text-sm font-semibold mb-4">Product</h5>
                <ul className="space-y-3 text-sm">
                  {["Features", "Pricing", "Changelog", "Roadmap"].map(l => (
                    <li key={l}><Link href="#" className="text-slate-500 hover:text-[#39ff14] transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-white text-sm font-semibold mb-4">Company</h5>
                <ul className="space-y-3 text-sm">
                  {["About", "Blog", "Careers", "Contact"].map(l => (
                    <li key={l}><Link href="#" className="text-slate-500 hover:text-[#39ff14] transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-white text-sm font-semibold mb-4">Legal</h5>
                <ul className="space-y-3 text-sm">
                  {["Privacy", "Terms", "Cookies"].map(l => (
                    <li key={l}><Link href="#" className="text-slate-500 hover:text-[#39ff14] transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-xs">© 2026 RankGhost. All rights reserved.</p>
            <p className="text-slate-600 text-xs">AI-Powered SEO Tracking</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
