"use client";

import Image from "next/image";
import { Bell, MessageSquare, Menu, Search, ShoppingCart } from "lucide-react";
import type { User } from "@/types";

export function Topbar({ user, onMenu }: { user: User; onMenu: () => void }) {
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
        <IconButton icon={ShoppingCart} count={2} />
        <IconButton icon={Bell} count={3} />
        <IconButton icon={MessageSquare} />

        <div className="ml-2 flex items-center gap-2.5 rounded-xl border border-surface-muted bg-white py-1 pl-1 pr-3">
          <Image
            src={user.avatar}
            alt={user.name}
            width={34}
            height={34}
            className="rounded-lg"
          />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold text-ink">Hey, {user.name.split(" ")[0]} 👋</div>
            <div className="text-[11px] capitalize text-ink-muted">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  icon: Icon,
  count,
}: {
  icon: typeof Bell;
  count?: number;
}) {
  return (
    <button className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted hover:text-brand-700">
      <Icon size={19} />
      {count ? (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}
