"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";

const STATS = [
  { value: 12, suffix: "L+", label: "Happy students" },
  { value: 350, suffix: "+", label: "Expert educators" },
  { value: 1500, suffix: "+", label: "Hours of content" },
  { value: 94, suffix: "%", label: "Success rate" },
];

export function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:26px_26px] opacity-30" />
      <div className="container-px relative grid grid-cols-2 gap-8 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="font-display text-4xl font-extrabold sm:text-5xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-1 text-sm text-white/75">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
