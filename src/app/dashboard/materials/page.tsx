export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getMyStudyMaterials } from "@/lib/data";
import { MaterialsClient } from "./materials-client";

export const metadata: Metadata = { title: "Study Material" };

export default async function StudyMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const [{ course }, { materials, courses }] = await Promise.all([
    searchParams,
    getMyStudyMaterials(),
  ]);

  // Deep links from a course page arrive as ?course=<slug>.
  const initialCourseId = courses.find((c) => c.slug === course)?.id ?? "all";

  return (
    <MaterialsClient
      materials={materials}
      courses={courses}
      initialCourseId={initialCourseId}
    />
  );
}
