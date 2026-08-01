import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import BlogEditor from "./blog-editor";

export const dynamic = "force-dynamic";

export default async function NewBlogPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });

  const subjects = await prisma.blog.findMany({
    where: { published: true },
    select: { subject: true },
    distinct: ["subject"],
    orderBy: { subject: "asc" },
  });

  const subjectList = subjects.map((s) => s.subject);

  return <BlogEditor instructor={instructor} subjects={subjectList} />;
}
