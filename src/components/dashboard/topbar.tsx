"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, KeyRound, LogOut, Menu, MessageSquare, Search, Settings, ShoppingCart } from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/change-password-modal";
import type { User } from "@/types";

export function Topbar({ user, onMenu }: { user: User; onMenu: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-muted bg-white/85 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenu}
        className="grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex max-w-xl flex-1 items-center gap-2 rounded-xl border border-surface-muted bg-surface-subtle px-3 py-2 transition-colors focus-within:border-brand-300 focus-within:bg-white">
        <Search size={18} className="text-ink-muted" />
        <input
          placeholder="Search for courses, topics, instructors…"
          className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton icon={ShoppingCart} />
        <IconButton icon={Bell} />
        <IconButton icon={MessageSquare} />

        <div ref={profileRef} className="relative ml-2">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-xl border border-surface-muted bg-white py-1 pl-1 pr-2 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
            aria-expanded={profileOpen}
          >
            <Image
              src={user.avatar}
              alt={user.name}
              width={34}
              height={34}
              className="rounded-lg"
            />
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-semibold text-ink">Hey, {user.name.split(" ")[0]}</div>
              <div className="text-[11px] capitalize text-ink-muted">{user.role}</div>
            </div>
            <ChevronDown
              size={15}
              className={`text-ink-muted transition-transform ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-surface-muted bg-white p-1.5 shadow-card">
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
              >
                <Settings size={16} /> Profile Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700"
              >
                <KeyRound size={16} /> Change Password
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </header>
  );
}

function IconButton({ icon: Icon }: { icon: typeof Bell }) {
  return (
    <button className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700">
      <Icon size={19} />
    </button>
  );
}
