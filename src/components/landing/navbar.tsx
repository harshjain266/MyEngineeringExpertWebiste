"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";

export interface MenuProgram {
  slug: string;
  name: string;
  icon: string;
  blurb: string;
  audience: string;
  accent: string;
  courses: { slug: string; title: string }[];
}

export interface MenuGroup {
  group: string;
  programs: MenuProgram[];
}

const QUICK_LINKS = [
  { label: "Live Classes", href: "/#features" },
  { label: "EE Skills", href: "/#features" },
];

export function Navbar({ menu }: { menu: MenuGroup[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "border-b border-surface-muted bg-white/90 shadow-soft backdrop-blur-xl"
          : "bg-white/70 backdrop-blur-md",
      )}
    >
      <nav className="container-px flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          <AllCoursesMenu menu={menu} isAuthed={isAuthed} />
          {isAuthed && (
            <Link
              href="/dashboard/my-courses"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
            >
              My Courses
            </Link>
          )}
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthed ? (
            <UserMenu name={session?.user?.name ?? "Student"} avatar={(session?.user as any)?.avatar} />
          ) : (
            <LoginButton />
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu
            menu={menu}
            isAuthed={isAuthed}
            onClose={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ───────────────────────── All Courses mega-menu ───────────────────────── */

function AllCoursesMenu({ menu, isAuthed }: { menu: MenuGroup[]; isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allPrograms = menu.flatMap((g) => g.programs);
  const active = allPrograms.find((p) => p.slug === activeSlug) ?? allPrograms[0] ?? null;

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150",
          open
            ? "bg-brand-50 text-brand-700"
            : "text-ink-soft hover:bg-surface-muted hover:text-brand-700",
        )}
      >
        <BookOpen size={15} className="shrink-0" />
        All Courses
        <ChevronDown size={13} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && active && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full pt-2.5"
            style={{ zIndex: 60 }}
          >
            <div className="w-[820px] overflow-hidden rounded-2xl border border-surface-muted bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)]">

              {/* ── Top bar ── */}
              <div className="flex items-center justify-between border-b border-surface-muted/70 bg-surface-subtle px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted/70">
                  Browse Programs
                </span>
                {isAuthed && (
                  <Link
                    href="/dashboard/my-courses"
                    className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                  >
                    <BookOpen size={13} /> My Learning
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-[248px_1fr]">

                {/* ── Left: program list ── */}
                <div className="max-h-[400px] overflow-y-auto border-r border-surface-muted/70 bg-surface-subtle/50 py-3">
                  {menu.map((g) => (
                    <div key={g.group} className="mb-1 px-3">
                      <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">
                        {g.group}
                      </p>
                      {g.programs.map((p) => {
                        const isActive = active.slug === p.slug;
                        return (
                          <button
                            key={p.slug}
                            onMouseEnter={() => setActiveSlug(p.slug)}
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-150",
                              isActive
                                ? "bg-white shadow-soft"
                                : "hover:bg-white/80",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg transition-transform duration-150",
                                p.accent,
                                isActive && "scale-105",
                              )}
                            >
                              {p.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "truncate text-sm font-semibold leading-tight",
                                isActive ? "text-brand-700" : "text-ink-soft group-hover:text-ink",
                              )}>
                                {p.name}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-ink-muted/70">
                                {p.courses.length} course{p.courses.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <ChevronRight
                              size={14}
                              className={cn(
                                "shrink-0 transition-colors",
                                isActive ? "text-brand-500" : "text-ink-muted/40 group-hover:text-ink-muted",
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* ── Right: active program detail ── */}
                <div className="flex max-h-[400px] flex-col">
                  {/* Program banner */}
                  <div className={cn("bg-gradient-to-br p-5", active.accent)}>
                    <div className="flex items-start gap-4">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/70 text-3xl shadow-sm backdrop-blur">
                        {active.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold text-ink">
                          {active.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-ink-soft">{active.blurb}</p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft backdrop-blur">
                          {active.audience}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course list */}
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    {active.courses.length > 0 ? (
                      <div className="grid gap-0.5">
                        {active.courses.map((c, i) => (
                          <Link
                            key={c.slug}
                            href={`/courses/${c.slug}`}
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted"
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-muted text-[11px] font-bold text-ink-muted group-hover:bg-brand-100 group-hover:text-brand-700">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="flex-1 text-sm text-ink-soft group-hover:text-ink">
                              {c.title}
                            </span>
                            <ArrowRight
                              size={14}
                              className="shrink-0 text-ink-muted/30 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
                            />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <span className="text-3xl">🚧</span>
                        <p className="mt-2 text-sm font-medium text-ink-muted">Courses coming soon</p>
                      </div>
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div className="border-t border-surface-muted/70 bg-surface-subtle/50 px-4 py-3">
                    <Link
                      href={`/programs/${active.slug}`}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-soft transition-shadow hover:shadow-card"
                    >
                      <span className="text-sm font-semibold text-ink">
                        Explore all <span className="text-brand-700">{active.name}</span> courses
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-brand-700">
                        {active.courses.length} courses
                        <ArrowRight size={15} />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Auth controls ───────────────────────── */

function LoginButton() {
  const { open } = useAuthModal();
  return (
    <Button size="sm" onClick={() => open()}>
      Login / Register
    </Button>
  );
}

function UserMenu({ name, avatar }: { name: string; avatar?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const firstName = name.split(" ")[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-surface-muted bg-white py-1 pl-1 pr-2.5 text-sm font-medium text-ink shadow-soft transition-colors hover:border-brand-200"
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={30}
            height={30}
            className="rounded-lg"
          />
        ) : (
          <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
            {firstName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden sm:block">Hey, {firstName}</span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-surface-muted bg-white p-1.5 shadow-card"
          >
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link
              href="/dashboard/my-courses"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
            >
              <BookOpen size={16} /> My Courses
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut size={16} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Mobile menu ───────────────────────── */

function MobileMenu({
  menu,
  isAuthed,
  onClose,
}: {
  menu: MenuGroup[];
  isAuthed: boolean;
  onClose: () => void;
}) {
  const { open } = useAuthModal();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-t border-surface-muted bg-white lg:hidden"
    >
      <div className="container-px max-h-[70vh] overflow-y-auto py-4">
        {isAuthed && (
          <Link
            href="/dashboard/my-courses"
            onClick={onClose}
            className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-700"
          >
            <BookOpen size={16} /> My Courses
          </Link>
        )}
        {menu.map((g) => (
          <div key={g.group} className="mb-3">
            <div className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              {g.group}
            </div>
            {g.programs.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-muted"
              >
                <span className="text-base">{p.icon}</span> {p.name}
              </Link>
            ))}
          </div>
        ))}

        {isAuthed ? (
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              onClose();
              signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut size={16} /> Logout
          </Button>
        ) : (
          <Button
            className="mt-2 w-full"
            onClick={() => {
              onClose();
              open();
            }}
          >
            Login / Register
          </Button>
        )}
      </div>
    </motion.div>
  );
}
