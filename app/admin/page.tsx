"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "rajhirvate@gmail.com";

type UserRow = {
  uid: string;
  email: string | null;
  plan: string;
  subscriptionStatus: string | null;
  paypalSubscriptionId: string | null;
  subscriptionActivatedAt: string | null;
  createdAt: string | null;
};

type AdminData = {
  users: UserRow[];
  planCounts: Record<string, number>;
  total: number;
};

const PLAN_ORDER = ["agency", "pro", "starter", "free"];

const planBadge: Record<string, string> = {
  agency:  "bg-purple-100 text-purple-700 border border-purple-200",
  pro:     "bg-[#39ff14]/10 text-green-700 border border-[#39ff14]/30",
  starter: "bg-blue-50 text-blue-600 border border-blue-200",
  free:    "bg-slate-100 text-slate-500 border border-slate-200",
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    if (loading) return;
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      router.replace("/dashboard");
      return;
    }
    user.getIdToken().then(async (token) => {
      const res = await fetch("/api/admin/users", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
      setFetching(false);
    });
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="h-7 w-7 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const filtered = data.users
    .filter((u) => planFilter === "all" || u.plan === planFilter)
    .filter((u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid.includes(search)
    )
    .sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan));

  const paid = data.users.filter((u) => u.plan !== "free").length;

  return (
    <div className="min-h-screen bg-[#FDFCFA] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-normal text-slate-800 mb-1">Admin Panel</h1>
          <p className="text-sm text-slate-400">User & subscription overview</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users",   value: data.total },
            { label: "Paid",          value: paid },
            { label: "Free",          value: data.planCounts["free"] ?? 0 },
            { label: "Conversion",    value: data.total > 0 ? `${Math.round((paid / data.total) * 100)}%` : "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-black/[0.07] bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
              <p className="font-display text-3xl font-normal text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {["starter", "pro", "agency", "free"].map((p) => (
            <div key={p} className="rounded-xl border border-black/[0.07] bg-white p-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">{p}</p>
                <p className="font-display text-2xl font-normal text-slate-800">{data.planCounts[p] ?? 0}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${planBadge[p]}`}>{p}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email or UID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-black/[0.07] bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#39ff14]/40"
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-black/[0.07] bg-white px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#39ff14]/40"
          >
            <option value="all">All plans</option>
            <option value="agency">Agency</option>
            <option value="pro">Pro</option>
            <option value="starter">Starter</option>
            <option value="free">Free</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.07]">
                {["Email", "Plan", "Status", "Subscribed At", "PayPal ID"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.uid} className={`border-b border-black/[0.07] last:border-0 ${i % 2 === 1 ? "bg-[#FAFAF7]" : ""}`}>
                  <td className="px-6 py-3.5 text-slate-700">{u.email ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${planBadge[u.plan] ?? planBadge.free}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {u.subscriptionStatus ? (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${u.subscriptionStatus === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {u.subscriptionStatus}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 text-xs">
                    {u.subscriptionActivatedAt ? new Date(u.subscriptionActivatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                    {u.paypalSubscriptionId ?? "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-right">{filtered.length} of {data.total} users shown</p>
      </div>
    </div>
  );
}
