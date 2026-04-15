"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/components/auth-provider";
import { KeywordDoc, ProjectDoc } from "@/lib/types";
import { PLAN_LIMITS } from "@/lib/plans";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";

type ProjectRow = ProjectDoc & { id: string };

function RankDot({ avg }: { avg: number | null }) {
  if (avg === null) return <span className="h-2 w-2 rounded-full bg-[#1e2d45] inline-block" />;
  if (avg <= 10) return <span className="h-2 w-2 rounded-full bg-[#00f5a0] inline-block shadow-[0_0_6px_#00f5a0]" />;
  if (avg <= 30) return <span className="h-2 w-2 rounded-full bg-[#ffd60a] inline-block shadow-[0_0_6px_#ffd60a]" />;
  return <span className="h-2 w-2 rounded-full bg-[#ff4d6d] inline-block shadow-[0_0_6px_#ff4d6d]" />;
}

export default function DashboardPage() {
  const { user, plan } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [rankedKeywords, setRankedKeywords] = useState(0);
  const [averageRank, setAverageRank] = useState<number | null>(null);
  const [projectAvgRanks, setProjectAvgRanks] = useState<Record<string, number | null>>({});
  const [projectKeywordCounts, setProjectKeywordCounts] = useState<Record<string, number>>({});
  const [projectLastChecked, setProjectLastChecked] = useState<Record<string, string | null>>({});
  const [usageOpen, setUsageOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    const db = getClientDb();
    const projectsRef = collection(db, "users", user.uid, "projects");
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      setProjects(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as ProjectDoc) }))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      );
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || projects.length === 0) {
      setTotalKeywords(0); setRankedKeywords(0); setAverageRank(null);
      setProjectAvgRanks({}); setProjectKeywordCounts({});
      return;
    }
    const db = getClientDb();
    const loadMetrics = async () => {
      let total = 0, ranked = 0, rankSum = 0;
      const avgRanks: Record<string, number | null> = {};
      const kwCounts: Record<string, number> = {};
      const lastChecked: Record<string, string | null> = {};

      for (const project of projects) {
        const snap = await getDocs(collection(db, "users", user.uid, "projects", project.id, "keywords"));
        let pRanked = 0, pSum = 0, latestCheck: string | null = null;
        snap.docs.forEach((d) => {
          const row = d.data() as KeywordDoc;
          total += 1;
          if (typeof row.currentRank === "number") { ranked += 1; rankSum += row.currentRank; pRanked += 1; pSum += row.currentRank; }
          if (row.lastCheckedAt && (!latestCheck || row.lastCheckedAt > latestCheck)) {
            latestCheck = row.lastCheckedAt;
          }
        });
        kwCounts[project.id] = snap.docs.length;
        avgRanks[project.id] = pRanked > 0 ? Number((pSum / pRanked).toFixed(1)) : null;
        lastChecked[project.id] = latestCheck;
      }
      setTotalKeywords(total);
      setRankedKeywords(ranked);
      setAverageRank(ranked > 0 ? Number((rankSum / ranked).toFixed(1)) : null);
      setProjectAvgRanks(avgRanks);
      setProjectKeywordCounts(kwCounts);
      setProjectLastChecked(lastChecked);
    };
    loadMetrics().catch(console.error);
  }, [projects, user]);

  const stats = [
    { label: "Total Projects", value: projects.length, border: "border-t-blue-500", delta: null },
    { label: "Total Keywords", value: totalKeywords, border: "border-t-purple-500", delta: null },
    { label: "Keywords in Top 10", value: rankedKeywords, border: "border-t-[#00f5a0]", delta: null },
    { label: "Average Position", value: averageRank !== null ? `#${averageRank}` : "—", border: "border-t-[#ffd60a]", delta: null },
  ];

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FDFCFA]">
        <DashboardSidebar />
        <div className="flex-1 ml-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#FDFCFA]/80 backdrop-blur border-b border-black/[0.07]">
            <h1 className="font-display text-xl font-normal text-slate-800">Dashboard</h1>
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-2 rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </Link>
          </header>

          <main className="px-8 py-8">
            {/* Plan & Usage — top */}
            {(() => {
              const limit = PLAN_LIMITS[plan];
              const kwPct = Math.min((totalKeywords / limit.keywords) * 100, 100);
              const isPaid = plan === "starter" || plan === "pro" || plan === "agency";
              const hasAiCitations = plan === "starter" || plan === "pro" || plan === "agency";
              const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
              return (
                <div className="mb-6 rounded-xl border border-black/[0.07] bg-white overflow-hidden">
                  <button
                    onClick={() => setUsageOpen((v) => !v)}
                    className="w-full px-6 py-4 flex items-center justify-between border-b border-black/[0.07] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-sm font-normal text-slate-800">Plan &amp; Usage</h2>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isPaid ? "bg-[#39ff14] text-black" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                        {planLabel}
                      </span>
                    </div>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${usageOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${usageOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Keywords */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Keywords</span>
                        <span className="text-xs font-bold text-slate-800">{totalKeywords} / {limit.keywords}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#39ff14] transition-all duration-700" style={{ width: `${kwPct}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400">{limit.keywords - totalKeywords} remaining</p>
                    </div>

                    {/* Check frequency */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-slate-500">Check Frequency</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Every 24 hours</p>
                          <p className="text-[11px] text-slate-400">Per keyword cooldown</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Citation */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-slate-500">AI Citation Checks</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${hasAiCitations ? "bg-[#39ff14]/10 border-[#39ff14]/20" : "bg-slate-50 border-slate-200"}`}>
                          <svg className={`h-3.5 w-3.5 ${hasAiCitations ? "text-[#39ff14]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {hasAiCitations ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${hasAiCitations ? "text-slate-800" : "text-slate-400"}`}>{hasAiCitations ? "Unlocked" : "Starter+"}</p>
                          <p className="text-[11px] text-slate-400">{hasAiCitations ? "GPT-4o mini · per check" : "Upgrade to access"}</p>
                        </div>
                      </div>
                    </div>

                    {/* SERP depth */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-slate-500">SERP Depth</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Top 100 results</p>
                          <p className="text-[11px] text-slate-400">10 pages × 10 results</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {plan === "free" && (
                    <div className="mx-6 mb-6 rounded-lg bg-gradient-to-r from-[#39ff14]/10 to-transparent border border-[#39ff14]/20 px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Upgrade to Starter</p>
                        <p className="text-xs text-slate-500 mt-0.5">Get 100 keywords, daily checks, and AI citation monitoring.</p>
                      </div>
                      <Link href="/#pricing" className="shrink-0 rounded-lg bg-[#39ff14] px-4 py-2 text-xs font-bold text-black hover:bg-[#2ecc14] transition-all">Upgrade</Link>
                    </div>
                  )}
                  </div>{/* end accordion body */}
                </div>
              );
            })()}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((s) => (
                <div key={s.label} className={`rounded-xl border-t-2 ${s.border} bg-white border border-black/[0.07] p-6 py-8 hover:border-[#2a3f5f] transition-all duration-200`}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black mb-4">{s.label}</p>
                  <p className="font-display text-3xl font-normal text-black leading-none">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Projects table */}
            <div className="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
                <h2 className="font-display text-sm font-normal text-slate-800">Projects</h2>
                <span className="text-xs text-slate-400">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
              </div>

              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="h-12 w-12 text-[#1e2d45] mb-4" viewBox="0 0 24 24" fill="none">
                    <path d="M12,4 C8.13401,4 5,7.13401 5,11 L5,19.6207 C5,19.9257 5.32764,20.1185 5.59426,19.9703 L6.53669,19.4468 C7.75977,18.7673 9.249,18.7762 10.4638,19.4704 L11.0077,19.7812 C11.6226,20.1326 12.3774,20.1326 12.9923,19.7812 L13.5362,19.4704 C14.751,18.7762 16.2402,18.7673 17.4633,19.4468 L18.4057,19.9703 C18.6724,20.1185 19,19.9257 19,19.6207 L19,11 C19,7.13401 15.866,4 12,4 Z M3,11 C3,6.02944 7.02944,2 12,2 C16.9706,2 21,6.02944 21,11 L21,19.6207 C21,21.4506 19.0341,22.6074 17.4345,21.7187 L16.492,21.1951 C15.8805,20.8553 15.1359,20.8598 14.5285,21.2069 L13.9846,21.5177 C12.7548,22.2204 11.2452,22.2204 10.0154,21.5177 L9.47154,21.2069 C8.86413,20.8598 8.11951,20.8553 7.50797,21.1951 L6.56554,21.7187 C4.96587,22.6074 3,21.4506 3,19.6207 L3,11 Z" fill="currentColor"/>
                  </svg>
                  <p className="text-slate-400 text-sm mb-1">No projects yet</p>
                  <p className="text-slate-400 text-xs mb-4">Create your first project to start tracking.</p>
                  <Link href="/dashboard/projects/new" className="rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all">
                    Create Project
                  </Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.07]">
                      {["Project Name", "Domain", "Keywords", "Avg Rank", "Last Checked", "Action"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((item, i) => {
                      const avg = projectAvgRanks[item.id] ?? null;
                      return (
                        <tr key={item.id} className={`border-b border-black/[0.07] last:border-0 transition-colors duration-150 hover:bg-[#F5F5F0] ${i % 2 === 1 ? "bg-[#FAFAF7]" : ""}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <RankDot avg={avg} />
                              <span className="text-slate-800 font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{item.domain}</td>
                          <td className="px-6 py-4 text-slate-400">{projectKeywordCounts[item.id] ?? 0}</td>
                          <td className="px-6 py-4 text-slate-800">{avg !== null ? `#${avg}` : "—"}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{projectLastChecked[item.id] ? new Date(projectLastChecked[item.id]!).toLocaleDateString() : "Never"}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/dashboard/projects/${item.id}`}
                              className="rounded-lg border border-black/[0.07] px-3 py-1.5 text-xs text-slate-400 hover:border-[#39ff14] hover:text-[#39ff14] transition-all duration-200"
                            >
                              View Keywords
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
