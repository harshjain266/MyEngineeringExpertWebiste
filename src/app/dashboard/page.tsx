export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { LiveClassPanel } from "@/components/dashboard/live-class-panel";
import { MasterClassAlert } from "@/components/dashboard/master-class-alert";
import { AnnouncementsPanel } from "@/components/dashboard/announcements-panel";
import { SectionHeader } from "@/components/dashboard/section-header";
import { CourseCard } from "@/components/course/course-card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <WelcomeBanner user={user} stats={data.stats} />

          {/* Master classes are free for every student, so they get a
              dashboard-level notification rather than only a side panel. */}
          <MasterClassAlert classes={data.masterClasses} />

          <QuickActions />

          <section>
            <SectionHeader title="Continue Learning" viewAllHref="/dashboard/my-courses" />
            <ContinueLearning items={data.enrolled} />
          </section>

          <section>
            <SectionHeader title="Recommended for You" viewAllHref="/dashboard/browse" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.recommended.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <LiveClassPanel
            liveClasses={data.batchClasses}
            title="Your Batch Classes"
            emptyTitle="No batch classes scheduled"
            viewAllHref="/dashboard/live-classes"
          />
          <LiveClassPanel
            liveClasses={data.masterClasses}
            title="Free Master Classes"
            emptyTitle="No master classes scheduled"
            viewAllHref="/dashboard/live-classes"
          />
          <AnnouncementsPanel items={data.announcements} />
        </aside>
      </div>
    </div>
  );
}
