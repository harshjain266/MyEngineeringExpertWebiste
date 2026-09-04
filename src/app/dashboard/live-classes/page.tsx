export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Layers3, Radio } from "lucide-react";
import { getAllLiveClasses, getMyBatchLiveClasses } from "@/lib/data";
import { LiveClassCard } from "@/components/dashboard/live-class-card";
import { Button } from "@/components/ui/button";
import type { LiveClass } from "@/types";

export const metadata: Metadata = { title: "Live Classes" };

const isLiveNow = (c: LiveClass) => c.status === "Live" || c.status === "Ongoing";

export default async function LiveClassesPage() {
  const [masterClasses, batchClasses] = await Promise.all([
    getAllLiveClasses(),
    getMyBatchLiveClasses(),
  ]);

  const liveNow = [...batchClasses, ...masterClasses].filter(isLiveNow);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Live Classes</h1>
        <p className="text-sm text-ink-muted">
          Your purchased batch sessions, plus free master classes open to everyone.
        </p>
      </div>

      {liveNow.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">Happening Now</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liveNow.map((c) => (
              <LiveClassCard key={c.id} item={c} isLive />
            ))}
          </div>
        </section>
      )}

      {/* ─── Paid batch classes ─── */}
      <Section
        icon={<Layers3 size={18} className="text-brand-700" />}
        title="Your Batch Classes"
        subtitle="Sessions for the courses you have purchased."
        classes={batchClasses.filter((c) => !isLiveNow(c))}
        empty={
          <>
            <p className="text-ink-muted">
              No batch classes scheduled in the next 7 days.
            </p>
            <Link href="/dashboard/browse" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Browse courses
              </Button>
            </Link>
          </>
        }
      />

      {/* ─── Free master classes ─── */}
      <Section
        icon={<GraduationCap size={18} className="text-emerald-700" />}
        title="Free Master Classes"
        subtitle="Open to every student — no purchase needed."
        classes={masterClasses.filter((c) => !isLiveNow(c))}
        empty={<p className="text-ink-muted">No master classes scheduled right now.</p>}
      />
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  classes,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  classes: LiveClass[];
  empty: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            <p className="text-xs text-ink-muted">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
          {classes.length} upcoming
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-none border border-dashed border-surface-muted bg-white py-12 text-center">
          <Radio size={26} className="mx-auto text-ink-muted/40" />
          <div className="mt-3">{empty}</div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <LiveClassCard key={c.id} item={c} />
          ))}
        </div>
      )}
    </section>
  );
}
