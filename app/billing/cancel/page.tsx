import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center relative">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[300px] w-[300px] rounded-full bg-white/5 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-3">Checkout cancelled</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            No charge was made. You can upgrade to Pro anytime from the pricing page.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/#pricing"
              className="font-display inline-block rounded-full bg-[#39ff14] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(57,255,20,0.4)] hover:scale-105 transition-all"
            >
              View Pricing
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
