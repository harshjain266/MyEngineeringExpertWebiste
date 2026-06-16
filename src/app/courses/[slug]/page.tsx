export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/landing/site-header";
import { Footer } from "@/components/landing/footer";
import { CourseDetailView } from "@/components/course/course-detail-view";
import { getCourseBySlug, isEnrolled } from "@/lib/data";
import { buildCourseDetail } from "@/lib/course-detail";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course ? course.title : "Course" };
}

export default async function CourseDetailPage({ params }: Params) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [detail, isPurchased] = await Promise.all([
    buildCourseDetail(course),
    isEnrolled(course.id),
  ]);

  return (
    <main>
      <SiteHeader />
      <CourseDetailView course={course} detail={detail} isPurchased={isPurchased} />
      <Footer />
    </main>
  );
}
