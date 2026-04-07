"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/components/auth-provider";
import { KeywordDoc } from "@/lib/types";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";

type KeywordRow = KeywordDoc & { id: string };

export default function DashboardPage() {
  const { user, plan } = useAuth();
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const db = getClientDb();
    const q = query(
      collection(db, "keywords"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKeywords(
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as KeywordDoc) }))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      );
    });

    return () => unsubscribe();
  }, [user]);

  const runCheck = async (keywordId: string) => {
    setError(null);
    setRunningId(keywordId);
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/check-rank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywordId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Check failed.");
      }
    } catch (checkError) {
      setError(
        checkError instanceof Error ? checkError.message : "Failed to run check."
      );
    } finally {
      setRunningId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-sm text-slate-400">
                Plan: <span className="uppercase">{plan}</span>
              </p>
            </div>
            <Link
              href="/dashboard/add"
              className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Add Keyword
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">SERP Rank</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">AI Citation</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800 bg-slate-950/70">
                    <td className="px-4 py-3">{item.keyword}</td>
                    <td className="px-4 py-3 text-slate-300">{item.domain}</td>
                    <td className="px-4 py-3">
                      {item.currentRank ? `#${item.currentRank}` : "Not found"}
                    </td>
                    <td className="px-4 py-3">
                      {typeof item.rankChange === "number"
                        ? item.rankChange > 0
                          ? `+${item.rankChange}`
                          : `${item.rankChange}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {plan === "free" ? "Locked" : item.aiCitationStatus}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => runCheck(item.id)}
                        disabled={runningId === item.id}
                        className="rounded-md border border-slate-700 px-3 py-1 hover:border-slate-500 disabled:opacity-60"
                      >
                        {runningId === item.id ? "Running..." : "Run Check"}
                      </button>
                    </td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={6}>
                      No keywords yet. Add your first tracked term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
