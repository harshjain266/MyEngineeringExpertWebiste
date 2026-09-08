"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/components/auth/change-password-modal";
import { avatarImage, cn, formatDate } from "@/lib/utils";
import type { User } from "@/types";

interface Props {
  user: User;
  memberSince: string;
  emailVerified: boolean;
  hasPassword: boolean;
  enrolledCount: number;
  orderCount: number;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const fieldCls =
  "h-11 w-full rounded-xl border border-surface-muted bg-white px-3 text-sm text-ink placeholder-ink-muted outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted";

export function ProfileSettingsClient({
  user,
  memberSince,
  emailVerified,
  hasPassword,
  enrolledCount,
  orderCount,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);

  const dirty =
    name.trim() !== user.name ||
    phone.trim() !== (user.phone ?? "") ||
    avatar !== (user.avatar ?? "");

  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const handlePickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    resetFeedback();
    if (file.size > MAX_AVATAR_BYTES) {
      setError("That image is over 2MB. Please pick a smaller one.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not upload that image. Please try again.");
        return;
      }
      setAvatar(data.url);
      setSuccess("Photo ready — save your changes to apply it.");
    } catch {
      setError("Could not upload that image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), avatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save your profile. Please try again.");
        return;
      }
      setSuccess("Your profile has been updated.");
      // The shell reads the user straight from the database, so a refresh is
      // what puts the new name and photo in the sidebar and topbar.
      router.refresh();
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setName(user.name);
    setPhone(user.phone ?? "");
    setAvatar(user.avatar ?? "");
    resetFeedback();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      {/* ─── Header ─── */}
      <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-card">
        <div className="bg-brand-gradient px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Account</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Profile Settings</h1>
          <p className="mt-1 text-sm text-white/80">
            Update your details, photo and password. Changes apply everywhere on EngineeringExpert.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-surface-muted sm:grid-cols-4">
          <Stat icon={<BookOpen size={15} />} label="Courses" value={String(enrolledCount)} />
          <Stat icon={<ShoppingBag size={15} />} label="Orders" value={String(orderCount)} />
          <Stat
            icon={<BadgeCheck size={15} />}
            label="Plan"
            value={user.plan === "premium" ? "Premium" : "Free"}
          />
          <Stat
            icon={<UserRound size={15} />}
            label="Member since"
            value={formatDate(memberSince)}
          />
        </div>
      </section>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          >
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── Personal details ─── */}
        <Card
          title="Personal details"
          description="This is how teachers and classmates see you."
          icon={<UserRound size={18} />}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* Plain <img>: the uploaded photo is a data URL, not a remote host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarImage(avatar, user.name)}
                  alt={user.name}
                  className="h-24 w-24 rounded-2xl border border-surface-muted object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Camera size={15} />
                  )}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                onChange={handlePickAvatar}
                className="hidden"
              />
              {avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar("");
                    resetFeedback();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-rose-600"
                >
                  <Trash2 size={12} /> Remove photo
                </button>
              )}
              <p className="max-w-[9rem] text-center text-[11px] leading-snug text-ink-muted">
                JPG, PNG, WebP or GIF. Up to 2MB.
              </p>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="profile-name" className={labelCls}>
                  Full name
                </label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    resetFeedback();
                  }}
                  maxLength={60}
                  placeholder="Your name"
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className={labelCls}>
                  Phone number
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <input
                    id="profile-phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      resetFeedback();
                    }}
                    placeholder="+91 98765 43210"
                    className={cn(fieldCls, "pl-9")}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  Used for class reminders. Leave empty to remove it.
                </p>
              </div>

              <div>
                <label htmlFor="profile-email" className={labelCls}>
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <input
                    id="profile-email"
                    value={user.email ?? "—"}
                    readOnly
                    className={cn(fieldCls, "cursor-not-allowed bg-surface-subtle pl-9 text-ink-muted")}
                  />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-muted">
                  {emailVerified ? (
                    <>
                      <BadgeCheck size={12} className="text-emerald-600" /> Verified — sign-in email
                      can&apos;t be changed here.
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} className="text-amber-600" /> Not verified yet. Check
                      your inbox for the link.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Security ─── */}
        <Card
          title="Security"
          description="Keep your account protected."
          icon={<ShieldCheck size={18} />}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-muted bg-surface-subtle/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-soft">
                <KeyRound size={17} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Password</p>
                <p className="text-xs text-ink-muted">
                  {hasPassword
                    ? "Change it regularly, and never reuse it elsewhere."
                    : "No password is set on this account yet."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPasswordOpen(true)}
              disabled={!hasPassword}
            >
              Change password
            </Button>
          </div>
        </Card>

        {/* ─── Sticky save bar ─── */}
        <AnimatePresence>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-muted bg-white/95 px-4 py-3 shadow-card backdrop-blur lg:left-auto lg:right-8"
            >
              <p className="text-sm font-semibold text-ink">You have unsaved changes.</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleReset} disabled={saving}>
                  Discard
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function Card({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-surface-muted bg-white shadow-soft">
      <div className="flex items-center gap-3 border-b border-surface-muted bg-surface-subtle px-6 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white px-5 py-4">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold leading-tight text-ink">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
