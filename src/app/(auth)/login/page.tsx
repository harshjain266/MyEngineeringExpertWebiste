"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful. Please verify your email before signing in.");
    } else if (searchParams.get("logout") === "true") {
      setSuccess("You have been successfully logged out.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(
          res.error === "EMAIL_NOT_VERIFIED"
            ? "Please verify your email. We sent a fresh verification link."
            : "Invalid email or password. Please try again.",
        );
        return;
      }
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      window.location.assign(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to your EngineeringExpert account</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} autoComplete="off">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="login-email"
                name="user-email"
                type="email"
                required
                autoComplete="off"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="user-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="off"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-slate-600">Don&apos;t have an account? </span>
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register
            </Link>
          </div>

          <div className="text-center text-xs text-slate-500">
            By continuing, you agree to our{" "}
            <Link href="#" className="underline">Terms</Link>{" "}and{" "}
            <Link href="#" className="underline">Privacy Policy</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="h-8 rounded-lg bg-slate-100" />
        <div className="space-y-4">
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
