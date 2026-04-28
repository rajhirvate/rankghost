"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] p-8 text-slate-300">
        <div className="max-w-lg rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 p-4 text-sm text-[#ff8aa0]">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
