"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Step = "PHONE" | "OTP" | "NAME";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const finishLogin = async (signupName?: string) => {
    const res = await signIn("otp", {
      phone,
      otp,
      ...(signupName ? { name: signupName } : {}),
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid or expired OTP. Please try again.");
      setStep("OTP");
      return false;
    }
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
    router.push(callbackUrl);
    router.refresh();
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setDevOtp(data.devOtp ?? null);
        setOtp("");
        setStep("OTP");
        setTimer(30); // 30s resend timer
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError("Invalid or expired OTP. Please try again.");
        return;
      }
      if (data.isNewUser) {
        setStep("NAME"); // first-time number → ask for name
      } else {
        await finishLogin();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await finishLogin(name.trim());
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {step === "PHONE" && "Welcome to EngineeringExpert"}
            {step === "OTP" && "Verify OTP"}
            {step === "NAME" && "Almost There!"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === "PHONE" && "Enter your phone number to continue"}
            {step === "OTP" && `OTP sent to +91 ${phone}`}
            {step === "NAME" && "Please enter your name to complete registration"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
        )}

        {step === "PHONE" && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                +91
              </span>
              <input
                type="tel"
                required
                className="block w-full rounded-lg border border-slate-300 py-3 pl-12 pr-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={loading || phone.length < 10}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}

        {step === "OTP" && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            {devOtp && (
              <div className="rounded-md bg-indigo-50 p-3 text-center text-sm text-indigo-700">
                Demo OTP: <strong className="tracking-widest">{devOtp}</strong>
              </div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                required
                className="block w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[1em] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <div className="text-center text-sm">
                {timer > 0 ? (
                  <p className="text-slate-500">
                    Resend OTP in{" "}
                    <span className="font-bold text-indigo-600">{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={loading || otp.length < 6}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("PHONE");
                setTimer(0);
              }}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {step === "NAME" && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitName}>
            <div>
              <input
                type="text"
                required
                className="block w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={loading || name.trim().length < 2}
            >
              {loading ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-slate-500">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
