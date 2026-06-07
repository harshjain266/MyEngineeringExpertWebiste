export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCourses } from "@/lib/data";
import { BrowseCoursesClient } from "./browse-client";

export const metadata: Metadata = { title: "All Courses" };

export default async function BrowseCoursesPage() {
  const courses = await getCourses();

  return <BrowseCoursesClient initialCourses={courses} />;
}
