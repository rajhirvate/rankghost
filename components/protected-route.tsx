"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
