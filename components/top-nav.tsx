"use client";

import { useAuth } from "@/components/auth-provider";
import Link from "next/link";

export function TopNav() {
  const { user, logout, plan } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-cyan-400">
          RankGhost
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-200 hover:text-white">
                Dashboard
              </Link>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase text-slate-300">
                {plan}
              </span>
              <button
                onClick={() => logout()}
                className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:border-slate-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-200 hover:text-white">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-cyan-500 px-3 py-1 font-medium text-slate-950 hover:bg-cyan-400"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
