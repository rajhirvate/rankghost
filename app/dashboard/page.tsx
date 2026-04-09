"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/components/auth-provider";
import { KeywordDoc, ProjectDoc } from "@/lib/types";
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
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [rankedKeywords, setRankedKeywords] = useState(0);
  const [averageRank, setAverageRank] = useState<number | null>(null);
  const [projectAvgRanks, setProjectAvgRanks] = useState<Record<string, number | null>>({});
  const [projectKeywordCounts, setProjectKeywordCounts] = useState<Record<string, number>>({});

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

      for (const project of projects) {
        const snap = await getDocs(collection(db, "users", user.uid, "projects", project.id, "keywords"));
        let pRanked = 0, pSum = 0;
        snap.docs.forEach((d) => {
          const row = d.data() as KeywordDoc;
          total += 1;
          if (typeof row.currentRank === "number") { ranked += 1; rankSum += row.currentRank; pRanked += 1; pSum += row.currentRank; }
        });
        kwCounts[project.id] = snap.docs.length;
        avgRanks[project.id] = pRanked > 0 ? Number((pSum / pRanked).toFixed(1)) : null;
      }
      setTotalKeywords(total);
      setRankedKeywords(ranked);
      setAverageRank(ranked > 0 ? Number((rankSum / ranked).toFixed(1)) : null);
      setProjectAvgRanks(avgRanks);
      setProjectKeywordCounts(kwCounts);
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
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                          <td className="px-6 py-4 text-slate-400 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
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
