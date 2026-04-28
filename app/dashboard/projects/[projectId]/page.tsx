"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SerpDrawer } from "@/components/serp-drawer";
import { useAuth } from "@/components/auth-provider";
import { PLAN_LIMITS } from "@/lib/plans";
import { KeywordDoc, ProjectDoc, SerpResult } from "@/lib/types";
import {
  addDoc, collection, doc, getCountFromServer, getDocs,
  limit, onSnapshot, orderBy, query,
} from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
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
  const [drawerKeyword, setDrawerKeyword] = useState<KeywordRow | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const exportCSV = () => {
    const rows = [
      ["Keyword", "SERP Rank", "Change", "AI Citation", "Last Checked"],
      ...keywords.map((k) => [
        k.keyword,
        k.currentRank != null ? `#${k.currentRank}` : "Not found",
        typeof k.rankChange === "number" ? (k.rankChange > 0 ? `▼${k.rankChange}` : k.rankChange < 0 ? `▲${Math.abs(k.rankChange)}` : "—") : "—",
        plan === "free" ? "Locked" : typeof k.aiCited === "boolean" ? (k.aiCited ? "Cited" : "Not cited") : (k.aiCitationStatus ?? "—"),
        k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleString() : "Never",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name ?? "report"}-keywords.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const pdf = new jsPDF({ orientation: "landscape" });

    pdf.setFontSize(18);
    pdf.setTextColor(30, 45, 69);
    pdf.text(project?.name ?? "Project Report", 14, 18);
    if (project?.domain) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(project.domain, 14, 25);
    }
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 31);

    autoTable(pdf, {
      startY: 37,
      head: [["Keyword", "SERP Rank", "Change", "AI Citation", "Last Checked"]],
      body: keywords.map((k) => [
        k.keyword,
        k.currentRank != null ? `#${k.currentRank}` : "Not found",
        typeof k.rankChange === "number" ? (k.rankChange > 0 ? `▼${k.rankChange}` : k.rankChange < 0 ? `▲${Math.abs(k.rankChange)}` : "—") : "—",
        plan === "free" ? "Locked" : typeof k.aiCited === "boolean" ? (k.aiCited ? "Cited ✓" : "Not cited") : (k.aiCitationStatus ?? "—"),
        k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleString() : "Never",
      ]),
      headStyles: { fillColor: [30, 45, 69], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [245, 245, 240] },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 }, 3: { cellWidth: 30 } },
    });

    pdf.save(`${project?.name ?? "report"}-keywords.pdf`);
    setShowExportMenu(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FDFCFA]">
        <DashboardSidebar />
        <div className="min-w-0 flex-1 pb-24 md:ml-60 md:pb-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex flex-col items-stretch justify-between gap-3 px-4 py-3 bg-[#FDFCFA]/80 backdrop-blur border-b border-black/[0.07] sm:px-6 md:flex-row md:items-center md:px-8 md:py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Link href="/dashboard" className="hover:text-[#39ff14] transition-colors">Dashboard</Link>
                <span>›</span>
                <span className="truncate text-slate-800">{project?.name ?? "Project"}</span>
              </div>
              <h1 className="truncate font-display text-xl font-normal text-slate-800">{project?.name ?? "Project"}</h1>
              {project?.domain && <p className="truncate text-xs text-slate-400 font-mono mt-0.5">{project.domain}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {keywords.length > 0 && (
                <button
                  onClick={runAllChecks}
                  disabled={runningAll}
                  className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-[#39ff14] hover:text-[#39ff14] transition-all duration-200 disabled:opacity-50 sm:px-4"
                >
                  {runningAll ? <Spinner /> : null}
                  {runningAll ? "Running all..." : "Run All Checks"}
                </button>
              )}
              {/* Export Report — Agency only */}
              <div className="relative" ref={exportMenuRef}>
                {plan === "agency" ? (
                  <>
                    <button
                      onClick={() => setShowExportMenu((v) => !v)}
                      disabled={keywords.length === 0}
                      className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all duration-200 disabled:opacity-40 sm:px-4"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Report
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-black/[0.07] bg-white shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={exportCSV}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#F5F5F0] transition-colors"
                        >
                          <svg className="h-4 w-4 text-[#00e5ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export CSV
                        </button>
                        <button
                          onClick={exportPDF}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#F5F5F0] transition-colors border-t border-black/[0.05]"
                        >
                          <svg className="h-4 w-4 text-[#ff4d6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Export PDF
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div title="Upgrade to Agency to export reports">
                    <button
                      disabled
                      className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400 cursor-not-allowed sm:px-4"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Export Report
                      <span className="text-[10px] rounded-full bg-[#7c3aed]/10 text-[#7c3aed] px-1.5 py-0.5 font-mono">Agency</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex min-h-10 items-center gap-2 rounded-lg bg-[#39ff14] px-3 py-2 text-sm font-semibold text-black hover:bg-[#2ecc14] transition-all duration-200 sm:px-4"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Keyword
              </button>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
            {/* Add keyword form */}
            {showAddForm && (
              <form onSubmit={addKeyword} className="mb-6 flex flex-col gap-3 rounded-xl border border-black/[0.07] bg-white p-4 sm:flex-row sm:items-center">
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
              <div className="px-4 py-4 border-b border-black/[0.07] flex items-center justify-between sm:px-6">
                <h2 className="font-display text-sm font-normal text-slate-800">Keywords</h2>
                <span className="text-xs font-medium text-slate-500">{keywords.length} keyword{keywords.length !== 1 ? "s" : ""}</span>
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
                <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.07]">
                      {["Keyword", "SERP Rank", "Change", "Trend", "AI Citation", "Last Checked", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((item, i) => (
                      <tr
                        key={item.id}
                        className={`border-b border-black/[0.07] last:border-0 transition-colors duration-150 hover:bg-[#F5F5F0] cursor-pointer ${i % 2 === 1 ? "bg-[#FAFAF7]" : ""}`}
                        onClick={() => setDrawerKeyword(item)}
                      >
                        <td className="px-5 py-4 font-medium text-slate-800 max-w-[200px] truncate">
                          <span className="hover:text-[#39ff14] transition-colors">{item.keyword}</span>
                        </td>
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
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">{relativeTime(item.lastCheckedAt)}</td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => runCheck(item.id)}
                              disabled={runningIds.has(item.id) || deletingId === item.id}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#39ff14] hover:text-[#39ff14] transition-all duration-200 disabled:opacity-50"
                            >
                              {runningIds.has(item.id) ? <Spinner /> : null}
                              {runningIds.has(item.id) ? "Running..." : "Run Check"}
                            </button>
                            <button
                              onClick={() => deleteKeyword(item.id)}
                              disabled={deletingId === item.id || runningIds.has(item.id)}
                              className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:border-[#ff4d6d]/60 hover:text-[#ff4d6d] transition-all duration-200 disabled:opacity-50"
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
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <SerpDrawer
        open={drawerKeyword !== null}
        onClose={() => setDrawerKeyword(null)}
        keyword={drawerKeyword?.keyword ?? ""}
        domain={project?.domain ?? ""}
        currentRank={drawerKeyword?.currentRank ?? null}
        results={(drawerKeyword?.serpTopResults ?? []) as SerpResult[]}
      />
    </ProtectedRoute>
  );
}
