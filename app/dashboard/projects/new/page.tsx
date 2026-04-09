"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/components/auth-provider";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getClientDb } from "@/lib/firebase";
import Link from "next/link";

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setError(null); setBusy(true);
    try {
      const db = getClientDb();
      const project = await addDoc(collection(db, "users", user.uid, "projects"), {
        name: name.trim(), domain: domain.trim(), createdAt: new Date().toISOString(),
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project.");
    } finally { setBusy(false); }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FDFCFA]">
        <DashboardSidebar />
        <div className="flex-1 ml-60">
          <header className="sticky top-0 z-30 flex items-center px-8 py-4 bg-[#FDFCFA]/80 backdrop-blur border-b border-black/[0.07]">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Link href="/dashboard" className="hover:text-[#39ff14] transition-colors">Dashboard</Link>
                <span>›</span>
                <span className="text-slate-800">New Project</span>
              </div>
              <h1 className="font-display text-xl font-normal text-slate-800">Create Project</h1>
            </div>
          </header>

          <main className="px-8 py-8">
            <div className="max-w-lg">
              <form onSubmit={handleSubmit} className="rounded-xl border border-black/[0.07] bg-white p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Project Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hostinger SEO Campaign"
                    required
                    className="w-full rounded-lg border border-black/[0.07] bg-[#F5F5F0] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#39ff14]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Target Domain</label>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. hostinger.com"
                    required
                    className="w-full rounded-lg border border-black/[0.07] bg-[#F5F5F0] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#39ff14]/50 focus:outline-none transition-all"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 p-3 text-sm text-[#ff4d6d]">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-[#39ff14] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#2ecc14] disabled:opacity-60 transition-all"
                  >
                    {busy ? "Creating..." : "Create Project"}
                  </button>
                  <Link href="/dashboard" className="rounded-lg border border-black/[0.07] px-5 py-2.5 text-sm text-slate-400 hover:text-slate-800 transition-all">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
