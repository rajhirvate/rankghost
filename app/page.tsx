import { TopNav } from "@/components/top-nav";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            SERP + AI Citation Monitoring
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Track rankings and AI citations before your competitors do.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            RankGhost helps SEO teams monitor keyword position shifts and whether
            AI engines mention your domain.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Start Free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:border-slate-500"
            >
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Live SERP Checks",
              body: "Run on-demand Google checks from your dashboard via Apify.",
            },
            {
              title: "Rank Movement",
              body: "See current rank and change vs. your previous check instantly.",
            },
            {
              title: "AI Citation Layer",
              body: "Unlock AI mention status in Pro to track emerging search channels.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="mb-2 text-xl font-semibold">{item.title}</h2>
              <p className="text-slate-300">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Pricing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-slate-300">For early-stage projects.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Up to 5 keywords</li>
                <li>1 check per keyword every 24h</li>
                <li>AI citation status locked</li>
              </ul>
            </article>
            <article className="rounded-xl border border-cyan-500 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold text-cyan-400">Pro</h3>
              <p className="mt-2 text-slate-300">For agencies and growth teams.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Up to 60 keywords</li>
                <li>Daily checks</li>
                <li>AI citation status unlocked</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
