"use client";

import { motion } from "framer-motion";
import type { LearningStats, User } from "@/types";

export function WelcomeBanner({ user, stats }: { user: User; stats: LearningStats }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-glow sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:24px_24px] opacity-30" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-24 top-6 hidden text-7xl opacity-90 lg:block animate-float">
        🧑‍🎓
      </div>

      <div className="relative max-w-2xl">
        <span className="text-sm font-medium text-white/80">Welcome back, {user.name.split(" ")[0]}! 👋</span>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          Let&apos;s continue your learning journey
        </h1>
        <p className="mt-1.5 text-sm text-white/75">Learn. Practice. Improve. Succeed.</p>
      </div>
    </motion.section>
  );
}
