"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { examCategories } from "@/lib/mock-data";
import { Reveal } from "@/components/ui/reveal";

export function ExamCategories() {
  return (
    <section id="categories" className="bg-surface-subtle py-20">
      <div className="container-px">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Find your path
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            We&apos;re preparing students for <span className="gradient-text">35+ categories</span>
          </h2>
          <p className="mt-3 text-ink-muted">
            Pick the track you&apos;re preparing for and get a structured plan, live classes and tests.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {examCategories.map((cat, i) => (
            <motion.a
              key={cat.id}
              href="#courses"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`group relative overflow-hidden rounded-3xl border border-white bg-gradient-to-br ${cat.accent} p-6 shadow-soft transition-shadow hover:shadow-card`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{cat.name}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cat.tracks.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-xs font-medium text-ink-soft backdrop-blur"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  {cat.icon}
                </span>
              </div>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                Explore category
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
