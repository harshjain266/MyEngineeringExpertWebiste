"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Search, Sparkles, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";

const FLOAT_CARDS = [
  { icon: "📡", title: "Live Class", sub: "Process Scheduling", className: "left-0 top-10" },
  { icon: "🏆", title: "Certificate", sub: "DSA Mastery", className: "right-0 top-24" },
  { icon: "✅", title: "12 hrs", sub: "On-demand video", className: "bottom-6 left-8" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient pb-24 pt-32 text-white">
      {/* decorative grid + blobs */}
      <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:28px_28px] opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />

      <div className="container-px relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left copy */}
        <div>
          {/* <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur"
          >
            <Sparkles size={14} className="text-amber-300" />
            Preparing students for 35+ exam categories
          </motion.span> */}

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Crack engineering exams the <span className="text-amber-300">smart</span> way.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
          >
            Live classes, structured courses and 1-on-1 doubt support —
            built for GATE, core engineering, placements and PSUs. Learn. Practice.
            Improve. Succeed.
          </motion.p>

          {/* search */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-glow"
          >
            <div className="flex flex-1 items-center gap-2 px-3 text-ink">
              <Search size={18} className="text-ink-muted" />
              <input
                placeholder="Search for courses, topics, instructors…"
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
              />
            </div>
            <Button size="md" className="shrink-0">Search</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Start learning free <ArrowRight size={18} />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <PlayCircle size={18} /> Watch demo
            </Button>
          </motion.div>
        </div>

        {/* Right visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
        >
          <div className="absolute inset-6 rounded-[2rem] bg-white/10 backdrop-blur-sm" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative h-56 w-56 animate-float rounded-full bg-white/15 ring-1 ring-white/30">
              <div className="absolute inset-6 rounded-full border-2 border-dashed border-white/40 animate-spin-slow" />
              <div className="absolute inset-0 grid place-items-center">
                <GraduationGlyph />
              </div>
            </div>
          </div>

          {FLOAT_CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              className={`absolute ${c.className} flex items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-card`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-lg">{c.icon}</span>
              <div>
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="text-xs text-ink-muted">{c.sub}</div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="absolute -bottom-2 right-10 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink shadow-card"
          >
            <Users size={16} className="text-brand-600" />
            <span className="text-xs font-semibold">2,450+ learning now</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function GraduationGlyph() {
  return (
    <svg width="92" height="92" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Z" fill="currentColor" />
      <path d="M5 13.18V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.82l-7 3.82-7-3.82Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
