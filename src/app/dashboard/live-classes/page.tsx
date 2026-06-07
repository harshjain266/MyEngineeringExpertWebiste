export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getAllLiveClasses } from "@/lib/data";
import { LiveClassCard } from "@/components/dashboard/live-class-card";

export const metadata: Metadata = { title: "Live Classes" };

export default async function LiveClassesPage() {
  const liveClasses = await getAllLiveClasses();

  const live = liveClasses.filter((c) => c.status === "Live");
  const upcoming = liveClasses.filter((c) => c.status !== "Live");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Live Classes</h1>
        <p className="text-sm text-ink-muted">Join interactive sessions with our top educators</p>
      </div>

      {live.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
            </span>
            <h2 className="font-display text-lg font-bold text-ink">Happening Now</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => (
              <LiveClassCard key={c.id} item={c} isLive />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">Upcoming Sessions</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-none border border-dashed border-surface-muted bg-white py-12 text-center">
            <p className="text-ink-muted">No upcoming classes scheduled.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((c) => (
              <LiveClassCard key={c.id} item={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
