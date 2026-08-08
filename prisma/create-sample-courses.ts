/**
 * Create "sample1" and "sample2" courses for every instructor.
 *
 * Courses are assigned a valid program slug and `disabled: false` so they show
 * up in the public "All Courses" navbar dropdown (no login required).
 *
 * Idempotent: safe to re-run. Run with: npx tsx prisma/create-sample-courses.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_TITLES = [
  { title: "sample1", program: "btech_bca" },
  { title: "sample2", program: "dsa" },
];

async function main() {
  const instructors = await prisma.instructor.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Creating sample courses for ${instructors.length} instructors…`);

  let created = 0;
  let skipped = 0;

  for (const ins of instructors) {
    for (const sample of SAMPLE_TITLES) {
      const slug = `${sample.title}-${ins.id}`;
      const existing = await prisma.course.findUnique({ where: { slug } });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.course.create({
        data: {
          slug,
          title: sample.title,
          category: "Computer Science",
          level: "Beginner",
          price: 0,
          originalPrice: 0,
          durationHours: 1,
          lectures: 1,
          language: "English",
          program: sample.program,
          disabled: false,
          instructorId: ins.id,
        },
      });
      created++;
    }
  }

  console.log(`✅ Done. Created ${created} course(s), ${skipped} already existed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
