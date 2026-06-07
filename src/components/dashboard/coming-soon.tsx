"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient text-white shadow-glow"
      >
        {icon ?? <Hammer size={34} />}
      </motion.span>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">
        {description ??
          "This screen is on the roadmap. The layout, data layer and navigation are already wired — the UI lands next."}
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
