"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/ui/reveal";

const TESTIMONIALS = [
  {
    name: "Sneha Reddy",
    role: "GATE CSE — AIR 312",
    avatar: "https://i.pravatar.cc/120?img=32",
    quote:
      "The live classes and DPPs were a game changer. I went from confused to confident in three months. The doubt support never let me get stuck.",
  },
  {
    name: "Arjun Mehta",
    role: "Placed at a product company",
    avatar: "https://i.pravatar.cc/120?img=14",
    quote:
      "The DSA and OOP tracks are gold. Structured, paced perfectly, and the mock interviews prepared me for the real thing.",
  },
  {
    name: "Priya Nair",
    role: "B.Tech, 3rd year",
    avatar: "https://i.pravatar.cc/120?img=49",
    quote:
      "Bilingual lectures helped me grasp tough concepts. EngineeringExpert feels like having a personal mentor 24/7.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-20">
      <div className="container-px">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Loved by learners
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
            Results that speak for themselves
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-3xl border border-surface-muted bg-surface-subtle p-7 shadow-soft"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-brand-200" />
              <Stars rating={5} />
              <blockquote className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Image src={t.avatar} alt={t.name} width={44} height={44} className="rounded-full" />
                <div>
                  <div className="font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-brand-600">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
