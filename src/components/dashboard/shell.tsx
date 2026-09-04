"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { User } from "@/types";

export function DashboardShell({
  user,
  children,
  badges,
  unreadCount = 0,
}: {
  user: User;
  children: React.ReactNode;
  /** Live nav counts keyed by href, resolved by the server layout. */
  badges?: Record<string, number>;
  /** Unread notifications, shown on the topbar bell. */
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-subtle">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar user={user} badges={badges} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar user={user} badges={badges} onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenu={() => setOpen(true)} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
