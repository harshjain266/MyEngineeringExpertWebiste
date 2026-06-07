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
  const courses = await getCourses();

  return (
    <main className="overflow-x-hidden">
      <SiteHeader />
      <Hero />
      <ExamCategories />
      <Features />
      <PopularCourses courses={courses} />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
