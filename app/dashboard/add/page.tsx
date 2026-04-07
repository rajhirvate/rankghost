"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/components/auth-provider";
import { PLAN_LIMITS } from "@/lib/plans";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getClientDb } from "@/lib/firebase";

export default function AddKeywordPage() {
  const { user, plan } = useAuth();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const db = getClientDb();
      const keywordQuery = query(
        collection(db, "keywords"),
        where("userId", "==", user.uid)
      );
      const existing = await getDocs(keywordQuery);

      if (existing.size >= PLAN_LIMITS[plan].keywords) {
        throw new Error(
          `Your ${plan} plan supports up to ${PLAN_LIMITS[plan].keywords} keywords.`
        );
      }

      await addDoc(collection(db, "keywords"), {
        userId: user.uid,
        keyword: keyword.trim(),
        domain: domain.trim(),
        currentRank: null,
        previousRank: null,
        rankChange: null,
        aiCitationStatus: "locked",
        lastCheckedAt: null,
        createdAt: new Date().toISOString(),
      });

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <TopNav />
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">Add keyword</h1>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword (e.g., best seo tool)"
              required
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Target domain (e.g., example.com)"
              required
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save keyword"}
            </button>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
