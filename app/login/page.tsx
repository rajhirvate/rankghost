import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
