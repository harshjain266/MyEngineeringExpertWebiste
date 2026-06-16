"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, User, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OpenOptions {
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

type Tab = "login" | "register";

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const redirectRef = useRef<string | undefined>(undefined);

  const reset = useCallback(() => {
    setTab("login");
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setSuccess("");
    setLoading(false);
  }, []);

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

  const handleLogin = useCallback(async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      close();
      router.push(redirectRef.current ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, close, router]);

  const handleRegister = useCallback(async () => {
    setError("");
    setSuccess("");
    if (!name.trim() || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      
      setSuccess("Account created successfully! Please sign in.");
      setTab("login");
      setPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, email, password]);

  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
  }, []);

  const ctxValue = useMemo(() => ({ open, close }), [open, close]);

  return (
    <AuthModalContext.Provider value={ctxValue}>
      {children}
      <AuthModalView
        isOpen={isOpen}
        tab={tab}
        name={name}
        email={email}
        password={password}
        showPassword={showPassword}
        loading={loading}
        error={error}
        success={success}
        onClose={close}
        onTabChange={switchTab}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword((v) => !v)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </AuthModalContext.Provider>
  );
}

function AuthModalView(props: {
  isOpen: boolean;
  tab: Tab;
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  success: string;
  onClose: () => void;
  onTabChange: (t: Tab) => void;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const {
    isOpen, tab, name, email, password, showPassword, loading, error, success,
    onClose, onTabChange, onNameChange, onEmailChange, onPasswordChange,
    onTogglePassword, onLogin, onRegister,
  } = props;

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
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-card"
          >
            {/* Header */}
            <div className="relative bg-brand-gradient px-6 pb-6 pt-6 text-white">
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
              <h2 className="mt-4 font-display text-2xl font-bold">
                {tab === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-1 text-sm text-white/85">
                {tab === "login"
                  ? "Sign in to continue learning"
                  : "Join EngineeringExpert and start learning"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-muted">
              <button
                onClick={() => onTabChange("login")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-colors",
                  tab === "login"
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-ink-muted hover:text-ink-soft",
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => onTabChange("register")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-colors",
                  tab === "register"
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-ink-muted hover:text-ink-soft",
                )}
              >
                Register
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              {error && (
                <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600 border border-emerald-100">
                  {success}
                </div>
              )}

              {tab === "login" ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); onLogin(); }}
                  className="space-y-4"
                >
                  <EmailInput value={email} onChange={onEmailChange} />
                  <PasswordInput
                    value={password}
                    onChange={onPasswordChange}
                    show={showPassword}
                    onToggle={onTogglePassword}
                    placeholder="Your password"
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); onRegister(); }}
                  className="space-y-4"
                >
                  <NameInput value={name} onChange={onNameChange} />
                  <EmailInput value={email} onChange={onEmailChange} />
                  <PasswordInput
                    value={password}
                    onChange={onPasswordChange}
                    show={showPassword}
                    onToggle={onTogglePassword}
                    placeholder="Min. 6 characters"
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account…</> : "Create Account"}
                  </Button>
                </form>
              )}

              <p className="text-center text-xs leading-relaxed text-ink-muted">
                By continuing you agree to EngineeringExpert&apos;s Terms of Service &amp; Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Email address</span>
      <div className="flex items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 transition-colors focus-within:border-brand-300 focus-within:bg-white">
        <Mail size={18} className="shrink-0 text-ink-muted" />
        <input
          type="email"
          autoComplete="email"
          placeholder=""
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-muted"
        />
      </div>
    </label>
  );
}

function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Full name</span>
      <div className="flex items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 transition-colors focus-within:border-brand-300 focus-within:bg-white">
        <User size={18} className="shrink-0 text-ink-muted" />
        <input
          type="text"
          autoComplete="name"
          placeholder=""
          maxLength={60}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-muted"
        />
      </div>
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Password</span>
      <div className="flex items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 transition-colors focus-within:border-brand-300 focus-within:bg-white">
        <Lock size={18} className="shrink-0 text-ink-muted" />
        <input
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-muted"
        />
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-ink-muted hover:text-ink-soft"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
