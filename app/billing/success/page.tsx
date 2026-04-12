import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-[#39ff14]/15 blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Icon */}
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.2)]">
            <svg className="h-10 w-10 text-[#39ff14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-3">You&apos;re on Pro!</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            Your RankGhost Pro subscription is now active. You have access to 60 keywords, AI citation monitoring, and bulk parallel checks.
          </p>
          <p className="text-slate-600 text-xs mb-8">
            Your plan has been updated — it may take a moment to reflect in the dashboard.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="font-display inline-block rounded-full bg-[#39ff14] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(57,255,20,0.4)] hover:scale-105 transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
