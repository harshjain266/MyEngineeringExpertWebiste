"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  MessageCircleQuestion,
  NotebookPen,
  Radio,
  Trophy,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const FEATURES = [
  {
    icon: Radio,
    title: "Interactive Live Classes",
    body: "Daily live sessions with India's top educators — ask questions in real time and never miss a class with recordings.",
  },
  {
    icon: NotebookPen,
    title: "Notes & DPPs",
    body: "Chapter-wise notes and Daily Practice Problems (DPPs) with detailed solutions to strengthen your concepts.",
  },
  {
    icon: MessageCircleQuestion,
    title: "1-on-1 Doubt Support",
    body: "Stuck on a problem? Get your doubts cleared by mentors within minutes through our doubt engine.",
  },
  {
    icon: CalendarClock,
    title: "Structured Study Plans",
    body: "Personalised, exam-ready schedules that adapt to your pace and keep you consistent every single day.",
  },
  {
    icon: Trophy,
    title: "Quizzes & Leaderboards",
    body: "Gamified practice with streaks, badges and leaderboards that turn revision into a habit.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Certificates",
    body: "Earn shareable certificates on completion to showcase your skills to recruiters and on LinkedIn.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="container-px">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Why EngineeringExpert
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            Everything you need to succeed, in one place
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-2xl border border-surface-muted bg-surface-subtle p-6 transition-all hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-card"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
                <f.icon size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
