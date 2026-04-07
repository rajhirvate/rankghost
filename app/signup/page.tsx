import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <AuthForm mode="signup" />
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
