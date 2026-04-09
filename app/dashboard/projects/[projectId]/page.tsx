"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/components/auth-provider";
import { PLAN_LIMITS } from "@/lib/plans";
import { KeywordDoc, ProjectDoc } from "@/lib/types";
import {
  addDoc, collection, doc, getCountFromServer, getDocs,
  limit, onSnapshot, orderBy, query,
} from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

type KeywordRow = KeywordDoc & { id: string };
type HistoryPoint = { rank: number; checkedAt: string };

function RankBadge({ rank }: { rank: number | null | undefined }) {
  if (!rank) return <span className="font-mono text-xs text-slate-400">Not found</span>;
  const cls =
    rank <= 3 ? "bg-[#00f5a0]/10 text-[#00f5a0] border-[#00f5a0]/20" :
    rank <= 10 ? "bg-[#39ff14]/10 text-[#39ff14] border-[#00e5ff]/20" :
    rank <= 30 ? "bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20" :
    "bg-[#ff4d6d]/10 text-[#ff4d6d] border-[#ff4d6d]/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${cls}`}>
      #{rank}
    </span>
  );
}

function ChangeBadge({ change }: { change: number | null | undefined }) {
  if (typeof change !== "number") return <span className="text-slate-400 font-mono text-xs">—</span>;
  if (change === 0) return <span className="text-slate-400 font-mono text-xs">—</span>;
  const improved = change < 0;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${improved ? "text-[#00f5a0]" : "text-[#ff4d6d]"}`}>
      {improved ? "▲" : "▼"} {Math.abs(change)}
    </span>
  );
}

function AICitationBadge({ plan, aiCited, aiReason, aiCitationStatus }: { plan: string; aiCited?: boolean; aiReason?: string; aiCitationStatus?: string }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2.5 py-0.5 text-xs text-[#7c3aed]">
        🔒 Pro only
      </span>
    );
  }
  if (aiReason === "Check failed") {
    return <span className="text-xs text-[#ff4d6d]">Check failed</span>;
  }
  if (typeof aiCited === "boolean") {
    return aiCited
      ? <span className="inline-flex items-center gap-1 rounded-full border border-[#00f5a0]/30 bg-[#00f5a0]/10 px-2.5 py-0.5 text-xs text-[#00f5a0]">Cited ✓</span>
      : <span className="inline-flex items-center rounded-full border border-black/[0.07] bg-white px-2.5 py-0.5 text-xs text-slate-400">Not cited</span>;
  }
  return <span className="text-xs text-slate-400">{aiCitationStatus ?? "—"}</span>;
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-[#39ff14]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProjectKeywordsPage() {
  const { user, plan } = useAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryPoint[]>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;
    const db = getClientDb();
    const projectRef = doc(db, "users", user.uid, "projects", projectId);
    const keywordsRef = collection(db, "users", user.uid, "projects", projectId, "keywords");
    const unsubProject = onSnapshot(projectRef, (s) => setProject(s.exists() ? (s.data() as ProjectDoc) : null));
    const unsubKeywords = onSnapshot(keywordsRef, (s) => {
      setKeywords(s.docs.map((d) => ({ id: d.id, ...(d.data() as KeywordDoc) })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    });
    return () => { unsubProject(); unsubKeywords(); };
  }, [projectId, user]);

  useEffect(() => {
    if (!user || !projectId || keywords.length === 0) { setHistoryMap({}); return; }
    const db = getClientDb();
    const loadHistory = async () => {
      const next: Record<string, HistoryPoint[]> = {};
      for (const kw of keywords) {
        const q = query(collection(db, "users", user.uid, "projects", projectId, "keywords", kw.id, "history"), orderBy("checkedAt", "desc"), limit(10));
        const snap = await getDocs(q);
        next[kw.id] = snap.docs.map((e) => e.data() as { rank?: number | null; checkedAt?: string })
          .filter((e): e is { rank: number; checkedAt: string } => typeof e.rank === "number" && typeof e.checkedAt === "string")
          .reverse();
      }
      setHistoryMap(next);
    };
    loadHistory().catch(console.error);
  }, [keywords, projectId, user]);

  const addKeyword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !projectId) return;
    setError(null); setBusyAdd(true);
    try {
      const db = getClientDb();
      const projectsSnap = await getDocs(collection(db, "users", user.uid, "projects"));
      let totalKwCount = 0;
      for (const pd of projectsSnap.docs) {
        const cs = await getCountFromServer(collection(db, "users", user.uid, "projects", pd.id, "keywords"));
        totalKwCount += cs.data().count;
      }
      if (totalKwCount >= PLAN_LIMITS[plan].keywords) throw new Error(`Your ${plan} plan supports up to ${PLAN_LIMITS[plan].keywords} keywords.`);
      await addDoc(collection(db, "users", user.uid, "projects", projectId, "keywords"), {
        userId: user.uid, keyword: newKeyword.trim(), currentRank: null, previousRank: null,
        rankChange: null, aiCitationStatus: "locked", lastCheckedAt: null, createdAt: new Date().toISOString(),
      });
      setNewKeyword(""); setShowAddForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add keyword.");
    } finally { setBusyAdd(false); }
  };

  const runCheck = async (keywordId: string) => {
    if (!user || !projectId) return;
    setError(null);
    setRunningIds((prev) => new Set(prev).add(keywordId));
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/check-rank", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ projectId, keywordId }) });
      if (!res.ok) { const p = (await res.json()) as { error?: string }; throw new Error(p.error ?? "Check failed."); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run check.");
    } finally {
      setRunningIds((prev) => { const n = new Set(prev); n.delete(keywordId); return n; });
    }
  };

  const runAllChecks = async () => {
    if (!user || !projectId || keywords.length === 0) return;
    setError(null); setRunningAll(true);
    setRunningIds(new Set(keywords.map((k) => k.id)));
    const token = await user.getIdToken();
    const results = await Promise.allSettled(keywords.map(async (row) => {
      try {
        const res = await fetch("/api/check-rank", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ projectId, keywordId: row.id }) });
        if (!res.ok) { const p = (await res.json()) as { error?: string }; throw new Error(p.error ?? `Check failed for "${row.keyword}".`); }
      } finally { setRunningIds((prev) => { const n = new Set(prev); n.delete(row.id); return n; }); }
    }));
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed.length > 0) setError(`${failed.length} check(s) failed: ${failed.map((r) => (r.reason instanceof Error ? r.reason.message : "Unknown")).join("; ")}`);
    setRunningAll(false);
  };

  const deleteKeyword = async (keywordId: string) => {
    if (!user || !projectId || !window.confirm("Delete this keyword? This cannot be undone.")) return;
    setError(null); setDeletingId(keywordId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/projects/${projectId}/keywords/${keywordId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const p = (await res.json()) as { error?: string }; throw new Error(p.error ?? "Delete failed."); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete keyword.");
    } finally { setDeletingId(null); }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FDFCFA]">
        <DashboardSidebar />
        <div className="flex-1 ml-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#FDFCFA]/80 backdrop-blur border-b border-black/[0.07]">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Link href="/dashboard" className="hover:text-[#39ff14] transition-colors">Dashboard</Link>
                <span>›</span>
                <span className="text-slate-800">{project?.name ?? "Project"}</span>
              </div>
              <h1 className="font-display text-xl font-normal text-slate-800">{project?.name ?? "Project"}</h1>
              {project?.domain && <p className="text-xs text-slate-400 font-mono mt-0.5">{project.domain}</p>}
            </div>
            <div className="flex items-center gap-3">
              {keywords.length > 0 && (
                <button
                  onClick={runAllChecks}
                  disabled={runningAll}
                  className="flex items-center gap-2 rounded-lg border border-black/[0.07] px-4 py-2 text-sm text-slate-400 hover:border-[#39ff14] hover:text-[#39ff14] transition-all duration-200 disabled:opacity-50"
                >
                  {runningAll ? <Spinner /> : null}
                  {runningAll ? "Running all..." : "Run All Checks"}
                </button>
              )}
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-2 rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Keyword
              </button>
            </div>
          </header>

          <main className="px-8 py-8">
            {/* Add keyword form */}
            {showAddForm && (
              <form onSubmit={addKeyword} className="mb-6 flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-4">
                <input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. best web hosting 2025"
                  required
                  className="flex-1 rounded-lg border border-black/[0.07] bg-[#F5F5F0] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#39ff14]/50 focus:outline-none transition-all"
                />
                <button type="submit" disabled={busyAdd} className="rounded-lg bg-[#39ff14] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#2ecc14] disabled:opacity-60 transition-all">
                  {busyAdd ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg border border-black/[0.07] px-4 py-2.5 text-sm text-slate-400 hover:text-slate-800 transition-all">
                  Cancel
                </button>
              </form>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 p-3 text-sm text-[#ff4d6d]">
                {error}
              </div>
            )}

            {/* Keywords table */}
            <div className="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
                <h2 className="font-display text-sm font-normal text-slate-800">Keywords</h2>
                <span className="text-xs text-slate-400">{keywords.length} keyword{keywords.length !== 1 ? "s" : ""}</span>
              </div>

              {keywords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="h-10 w-10 text-[#1e2d45] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-slate-400 text-sm mb-1">No keywords yet</p>
                  <p className="text-slate-400 text-xs">Click &quot;Add Keyword&quot; to start tracking.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.07]">
                      {["Keyword", "SERP Rank", "Change", "Trend", "AI Citation", "Last Checked", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((item, i) => (
                      <tr key={item.id} className={`border-b border-black/[0.07] last:border-0 transition-colors duration-150 hover:bg-[#F5F5F0] ${i % 2 === 1 ? "bg-[#FAFAF7]" : ""}`}>
                        <td className="px-5 py-4 font-medium text-slate-800 max-w-[200px] truncate">{item.keyword}</td>
                        <td className="px-5 py-4"><RankBadge rank={item.currentRank} /></td>
                        <td className="px-5 py-4"><ChangeBadge change={item.rankChange} /></td>
                        <td className="px-5 py-4">
                          {historyMap[item.id]?.length >= 2 ? (
                            <div className="h-8 w-24">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyMap[item.id]}>
                                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} reversed />
                                  <Line type="monotone" dataKey="rank" stroke="#00e5ff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <AICitationBadge plan={plan} aiCited={item.aiCited} aiReason={item.aiReason} aiCitationStatus={item.aiCitationStatus} />
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs font-mono">{relativeTime(item.lastCheckedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => runCheck(item.id)}
                              disabled={runningIds.has(item.id) || deletingId === item.id}
                              className="flex items-center gap-1.5 rounded-lg border border-black/[0.07] px-3 py-1.5 text-xs text-slate-400 hover:border-[#39ff14] hover:text-[#39ff14] transition-all duration-200 disabled:opacity-50"
                            >
                              {runningIds.has(item.id) ? <Spinner /> : null}
                              {runningIds.has(item.id) ? "Running..." : "Run Check"}
                            </button>
                            <button
                              onClick={() => deleteKeyword(item.id)}
                              disabled={deletingId === item.id || runningIds.has(item.id)}
                              className="rounded-lg border border-black/[0.07] p-1.5 text-slate-400 hover:border-[#ff4d6d]/50 hover:text-[#ff4d6d] transition-all duration-200 disabled:opacity-50"
                              title="Delete keyword"
                            >
                              {deletingId === item.id ? (
                                <Spinner />
                              ) : (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
