export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { ExamCategories } from "@/components/landing/exam-categories";
import { Features } from "@/components/landing/features";
import { PopularCourses } from "@/components/landing/popular-courses";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { getCourses } from "@/lib/data";

export default async function LandingPage() {
  // PopularCourses renders eight cards; fetching the full catalogue only to
  // serialise the rest into the RSC payload is wasted bytes on every visit.
  const courses = (await getCourses()).slice(0, 8);

  return (
    <main className="overflow-x-hidden">
      {/* Above the fold — rendered eagerly. */}
      <SiteHeader />
      <Hero />

      {/* Below the fold: the browser skips layout and paint until each nears
          the viewport. Still server-rendered, so SEO is unaffected. */}
      <div className="defer-offscreen">
        <ExamCategories />
      </div>
      <div className="defer-offscreen">
        <Features />
      </div>
      <div className="defer-offscreen">
        <PopularCourses courses={courses} />
      </div>
      <div className="defer-offscreen">
        <Testimonials />
      </div>
      <div className="defer-offscreen">
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
