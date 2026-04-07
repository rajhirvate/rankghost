"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = mode === "login" ? "Login" : "Create your account";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      router.push("/dashboard");
    } catch (submitError) {
      setError("Authentication failed. Please check your details.");
      console.error(submitError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
        </button>
      </form>
      <button
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            await loginWithGoogle();
            router.push("/dashboard");
          } catch (googleError) {
            setError("Google sign-in failed.");
            console.error(googleError);
          } finally {
            setBusy(false);
          }
        }}
        className="mt-3 w-full rounded-md border border-slate-700 px-4 py-2"
        disabled={busy}
      >
        Continue with Google
      </button>
    </div>
  );
}
