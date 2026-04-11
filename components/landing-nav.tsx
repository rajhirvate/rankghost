"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { useState, useEffect } from "react";

export function LandingNav() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 20) setMobileOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className={`flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 transition-all duration-300 ${
              scrolled
                ? "glass-card-dark shadow-xl shadow-black/20"
                : "bg-transparent"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <svg className="h-7 w-7 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,4 C8.13401,4 5,7.13401 5,11 L5,19.6207 C5,19.9257 5.32764,20.1185 5.59426,19.9703 L6.53669,19.4468 C7.75977,18.7673 9.249,18.7762 10.4638,19.4704 L11.0077,19.7812 C11.6226,20.1326 12.3774,20.1326 12.9923,19.7812 L13.5362,19.4704 C14.751,18.7762 16.2402,18.7673 17.4633,19.4468 L18.4057,19.9703 C18.6724,20.1185 19,19.9257 19,19.6207 L19,11 C19,7.13401 15.866,4 12,4 Z M3,11 C3,6.02944 7.02944,2 12,2 C16.9706,2 21,6.02944 21,11 L21,19.6207 C21,21.4506 19.0341,22.6074 17.4345,21.7187 L16.492,21.1951 C15.8805,20.8553 15.1359,20.8598 14.5285,21.2069 L13.9846,21.5177 C12.7548,22.2204 11.2452,22.2204 10.0154,21.5177 L9.47154,21.2069 C8.86413,20.8598 8.11951,20.8553 7.50797,21.1951 L6.56554,21.7187 C4.96587,22.6074 3,21.4506 3,19.6207 L3,11 Z M10.5,10.5 C10.5,11.3284 9.82843,12 9,12 C8.17157,12 7.5,11.3284 7.5,10.5 C7.5,9.67157 8.17157,9 9,9 C9.82843,9 10.5,9.67157 10.5,10.5 Z M15,12 C15.8284,12 16.5,11.3284 16.5,10.5 C16.5,9.67157 15.8284,9 15,9 C14.1716,9 13.5,9.67157 13.5,10.5 C13.5,11.3284 14.1716,12 15,12 Z" fill="currentColor"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">RankGhost</span>
                <span className="hidden sm:block text-[10px] text-slate-500 tracking-wide">AI-Powered SEO Tracking</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 text-base font-medium text-slate-400 md:flex">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="hover:text-[#39ff14] transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA + Mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* Desktop CTAs */}
              {user ? (
                <>
                  <Link href="/dashboard" className="hidden text-sm font-medium text-slate-400 hover:text-[#39ff14] transition-colors sm:block">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="hidden sm:block rounded-full bg-white/5 px-5 py-2 text-sm font-medium text-white hover:bg-white/10 transition-all border border-white/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden text-base font-medium text-slate-400 hover:text-[#39ff14] transition-colors md:block">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden sm:block font-display rounded-full bg-[#39ff14] px-5 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(57,255,20,0.5)] hover:scale-105 transition-all active:scale-95"
                  >
                    Try for Free
                  </Link>
                </>
              )}

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                aria-label="Toggle menu"
              >
                <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-[#0a0a0a] border-l border-white/10 flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <span className="font-display text-lg font-bold text-white">RankGhost</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 px-4 py-6 flex-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-400 hover:text-[#39ff14] hover:bg-white/5 transition-all font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="px-6 py-6 border-t border-white/5 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-full border border-white/10 py-3 text-sm font-medium text-white text-center hover:bg-white/5 transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full rounded-full bg-white/5 py-3 text-sm font-medium text-white border border-white/10 hover:bg-white/10 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-full border border-white/10 py-3 text-sm font-medium text-white text-center hover:bg-white/5 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="w-full font-display rounded-full bg-[#39ff14] py-3 text-sm font-bold text-black text-center shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-[1.02] transition-all"
                >
                  Try for Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
