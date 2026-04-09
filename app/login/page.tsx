import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

const bullets = [
  "7-day free trial, no card required",
  "Track SERP rankings in real time",
  "AI citation detection included",
  "Cancel anytime",
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#0a0f1e] px-14 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <svg className="h-8 w-8 text-[#39ff14]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12,4 C8.13401,4 5,7.13401 5,11 L5,19.6207 C5,19.9257 5.32764,20.1185 5.59426,19.9703 L6.53669,19.4468 C7.75977,18.7673 9.249,18.7762 10.4638,19.4704 L11.0077,19.7812 C11.6226,20.1326 12.3774,20.1326 12.9923,19.7812 L13.5362,19.4704 C14.751,18.7762 16.2402,18.7673 17.4633,19.4468 L18.4057,19.9703 C18.6724,20.1185 19,19.9257 19,19.6207 L19,11 C19,7.13401 15.866,4 12,4 Z M3,11 C3,6.02944 7.02944,2 12,2 C16.9706,2 21,6.02944 21,11 L21,19.6207 C21,21.4506 19.0341,22.6074 17.4345,21.7187 L16.492,21.1951 C15.8805,20.8553 15.1359,20.8598 14.5285,21.2069 L13.9846,21.5177 C12.7548,22.2204 11.2452,22.2204 10.0154,21.5177 L9.47154,21.2069 C8.86413,20.8598 8.11951,20.8553 7.50797,21.1951 L6.56554,21.7187 C4.96587,22.6074 3,21.4506 3,19.6207 L3,11 Z M10.5,10.5 C10.5,11.3284 9.82843,12 9,12 C8.17157,12 7.5,11.3284 7.5,10.5 C7.5,9.67157 8.17157,9 9,9 C9.82843,9 10.5,9.67157 10.5,10.5 Z M15,12 C15.8284,12 16.5,11.3284 16.5,10.5 C16.5,9.67157 15.8284,9 15,9 C14.1716,9 13.5,9.67157 13.5,10.5 C13.5,11.3284 14.1716,12 15,12 Z" fill="currentColor"/>
          </svg>
          <span className="font-display text-xl font-bold text-white">RankGhost</span>
        </Link>

        {/* Main copy */}
        <div>
          <h1 className="font-display text-5xl font-normal text-white leading-[1.08] mb-6">
            Welcome<br />back
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
            Join SEO professionals using RankGhost to dominate search and AI visibility.
          </p>
          <ul className="space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30">
                  <svg className="h-3 w-3 text-[#39ff14]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <span className="text-slate-300 text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-600 text-xs">© 2026 RankGhost. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-8 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-normal text-slate-900 mb-2">Sign in to your account</h2>
          <p className="text-slate-500 text-sm mb-8">Welcome back! Enter your details below.</p>
          <AuthForm mode="login" />
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold hover:underline" style={{color: "#1a9e00"}}>
              Start for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
