"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="bg-surface-subtle py-20">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white shadow-glow sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:26px_26px] opacity-30" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles size={14} className="text-amber-300" /> Limited-time: 40% OFF all courses
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Start your learning journey today
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/80">
              Join 12 lakh+ engineers who chose EngineeringExpert. Your first course is on us.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  Get started free <ArrowRight size={18} />
                </Button>
              </Link>
              <Button variant="outline" size="lg">Talk to a counsellor</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
