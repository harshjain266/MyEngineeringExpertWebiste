"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Phone, ShieldCheck, User, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OpenOptions {
  /** Where to navigate after a successful login (e.g. a "Buy now" target). */
  redirectTo?: string;
}

interface AuthModalContextValue {
  open: (opts?: OpenOptions) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return ctx;
}

type Step = "phone" | "otp" | "name";

const RESEND_SECONDS = 30;

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const redirectRef = useRef<string | undefined>(undefined);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setName("");
    setError("");
    setDevOtp(null);
    setResendIn(0);
    setLoading(false);
  }, []);

  // Resend countdown — ticks while we're on the OTP step.
  useEffect(() => {
    if (step !== "otp" || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const open = useCallback(
    (opts?: OpenOptions) => {
      redirectRef.current = opts?.redirectTo;
      reset();
      setIsOpen(true);
    },
    [reset],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    redirectRef.current = undefined;
  }, []);

  const requestOtp = useCallback(async () => {
    setError("");
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send OTP");
        return;
      }
      setDevOtp(data.devOtp ?? null);
      setOtp("");
      setStep("otp");
      setResendIn(RESEND_SECONDS);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  /** Completes sign-in via the NextAuth `otp` provider (optionally with a name). */
  const finishLogin = useCallback(
    async (signupName?: string) => {
      setLoading(true);
      try {
        const res = await signIn("otp", {
          phone: phone.replace(/\D/g, ""),
          otp: otp.replace(/\D/g, ""),
          ...(signupName ? { name: signupName } : {}),
          redirect: false,
        });
        if (res?.error) {
          setError("Invalid or expired OTP. Please try again.");
          setStep("otp");
          return;
        }
        const target = redirectRef.current ?? "/dashboard";
        close();
        router.push(target);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [otp, phone, close, router],
  );

  const verifyOtp = useCallback(async () => {
    setError("");
    if (otp.replace(/\D/g, "").length < 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
          otp: otp.replace(/\D/g, ""),
        }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError("Invalid or expired OTP. Please try again.");
        return;
      }
      if (data.isNewUser) {
        // First-time number → collect a name before creating the account.
        setStep("name");
        return;
      }
      await finishLogin();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, finishLogin]);

  const submitName = useCallback(async () => {
    setError("");
    if (name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }
    await finishLogin(name.trim());
  }, [name, finishLogin]);

  const ctxValue = useMemo(() => ({ open, close }), [open, close]);

  return (
    <AuthModalContext.Provider value={ctxValue}>
      {children}
      <AuthModalView
        isOpen={isOpen}
        step={step}
        phone={phone}
        otp={otp}
        name={name}
        loading={loading}
        error={error}
        devOtp={devOtp}
        resendIn={resendIn}
        onClose={close}
        onPhoneChange={setPhone}
        onOtpChange={setOtp}
        onNameChange={setName}
        onRequestOtp={requestOtp}
        onVerifyOtp={verifyOtp}
        onSubmitName={submitName}
        onResend={requestOtp}
        onBack={() => {
          setStep("phone");
          setOtp("");
          setError("");
          setResendIn(0);
        }}
      />
    </AuthModalContext.Provider>
  );
}

function AuthModalView(props: {
  isOpen: boolean;
  step: Step;
  phone: string;
  otp: string;
  name: string;
  loading: boolean;
  error: string;
  devOtp: string | null;
  resendIn: number;
  onClose: () => void;
  onPhoneChange: (v: string) => void;
  onOtpChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onSubmitName: () => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const {
    isOpen,
    step,
    phone,
    otp,
    name,
    loading,
    error,
    devOtp,
    resendIn,
    onClose,
    onPhoneChange,
    onOtpChange,
    onNameChange,
    onRequestOtp,
    onVerifyOtp,
    onSubmitName,
    onResend,
    onBack,
  } = props;

  const headings: Record<Step, { title: string; sub: string }> = {
    phone: {
      title: "Login or Register",
      sub: "Continue with your mobile number",
    },
    otp: {
      title: "Verify OTP",
      sub: `Enter the 6-digit code sent to +91 ${phone.replace(/\D/g, "")}`,
    },
    name: {
      title: "What's your name?",
      sub: "Tell us your name to finish creating your account",
    },
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-card"
          >
            {/* Header */}
            <div className="relative bg-brand-gradient px-6 pb-8 pt-6 text-white">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 [&_*]:!text-white">
                <Logo />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">
                {headings[step].title}
              </h2>
              <p className="mt-1 text-sm text-white/85">{headings[step].sub}</p>
            </div>

            <div className="space-y-5 px-6 py-6">
              {error && (
                <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}

              {step === "phone" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onRequestOtp();
                  }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
                      Mobile number
                    </span>
                    <div className="flex items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 transition-colors focus-within:border-brand-300 focus-within:bg-white">
                      <Phone size={18} className="text-ink-muted" />
                      <span className="text-sm font-semibold text-ink-soft">+91</span>
                      <input
                        autoFocus
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) =>
                          onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        className="h-12 w-full bg-transparent text-base tracking-wide outline-none placeholder:text-ink-muted"
                      />
                    </div>
                  </label>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Sending OTP…
                      </>
                    ) : (
                      "Get OTP"
                    )}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onVerifyOtp();
                  }}
                  className="space-y-4"
                >
                  {devOtp && (
                    <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
                      <ShieldCheck size={16} />
                      <span>
                        Demo OTP: <strong className="tracking-widest">{devOtp}</strong>
                      </span>
                    </div>
                  )}
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
                      One-time password
                    </span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="● ● ● ● ● ●"
                      value={otp}
                      onChange={(e) =>
                        onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className={cn(
                        "h-14 w-full rounded-xl border border-surface-muted bg-surface-subtle px-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition-colors",
                        "focus:border-brand-300 focus:bg-white",
                      )}
                    />
                  </label>

                  {/* Resend timer (30s) */}
                  <div className="flex items-center justify-center text-sm text-ink-muted">
                    {resendIn > 0 ? (
                      <span>
                        Resend OTP in{" "}
                        <span className="font-semibold tabular-nums text-ink-soft">
                          0:{String(resendIn).padStart(2, "0")}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onResend}
                        disabled={loading}
                        className="font-semibold text-brand-700 transition-colors hover:text-brand-800 disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Verifying…
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="mx-auto flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-brand-700"
                  >
                    <ArrowLeft size={14} /> Change number
                  </button>
                </form>
              )}

              {step === "name" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSubmitName();
                  }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
                      Full name
                    </span>
                    <div className="flex items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 transition-colors focus-within:border-brand-300 focus-within:bg-white">
                      <User size={18} className="text-ink-muted" />
                      <input
                        autoFocus
                        type="text"
                        maxLength={60}
                        placeholder="e.g. Aditya Kumar"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-muted"
                      />
                    </div>
                  </label>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Creating account…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              )}

              <p className="text-center text-xs leading-relaxed text-ink-muted">
                By continuing you agree to EngineeringExpert&apos;s Terms of Service
                &amp; Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
