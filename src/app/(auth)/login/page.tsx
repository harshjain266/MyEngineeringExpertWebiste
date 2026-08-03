"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, Mail } from "lucide-react";
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
  const [view, setView] = useState<"login" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("forgot") === "1") {
      setView("forgot");
      return;
    }
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
            : res.error.includes("disabled")
              ? res.error
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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSent(false);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setForgotSent(true);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {view === "login" ? "Welcome back" : "Forgot your password?"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {view === "login"
              ? "Sign in to your EngineeringExpert account"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {view === "login" ? (
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
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      setForgotEmail(email);
                      setForgotError("");
                      setForgotSent(false);
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </button>
                </div>
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
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleForgot} autoComplete="off">
            {forgotSent && (
              <div className="flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>
                  If an account exists for that email, a password reset link has been sent. Check
                  your inbox (and spam folder). The link expires in 1 hour.
                </span>
              </div>
            )}

            {forgotError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{forgotError}</div>
            )}

            {!forgotSent && (
              <div>
                <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!forgotSent && (
              <Button type="submit" className="w-full py-6 text-lg" disabled={forgotLoading}>
                {forgotLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Sending…
                  </span>
                ) : (
                  "Send reset link"
                )}
              </Button>
            )}

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setForgotError("");
                  setForgotSent(false);
                }}
                className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            </div>
          </form>
        )}
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
