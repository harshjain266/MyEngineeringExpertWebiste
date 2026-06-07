/**
 * Seed script — loads the same mock fixtures used by the UI into Postgres.
 * Run with: npm run db:seed  (after `npm run db:push` and `docker compose up -d`)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { courses, instructors, liveClasses, orders, announcements } from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding EngineeringExpert…");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Instructors
  for (const ins of Object.values(instructors)) {
    await prisma.instructor.upsert({
      where: { id: ins.id },
      update: {},
      create: {
        id: ins.id,
        name: ins.name,
        title: ins.title,
        avatar: ins.avatar,
        rating: ins.rating,
        students: ins.students,
      },
    });
  }

  // Courses
  for (const c of courses) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        plannerUrl: c.plannerUrl,
      },
      create: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        category: c.category,
        level: c.level,
        price: c.price,
        originalPrice: c.originalPrice,
        rating: c.rating,
        ratingCount: c.ratingCount,
        durationHours: c.durationHours,
        lectures: c.lectures,
        language: c.language,
        thumbnail: c.thumbnail,
        badge: c.badge,
        tags: c.tags,
        plannerUrl: c.plannerUrl,
        instructorId: c.instructor.id,
        popular: c.popular ?? false,
      },
    });
  }

  // Demo student
  const user = await prisma.user.upsert({
    where: { email: "aditya.kumar@email.com" },
    update: { password: hashedPassword },
    create: {
      name: "Aditya Kumar",
      email: "aditya.kumar@email.com",
      password: hashedPassword,
      avatar: "https://i.pravatar.cc/160?img=12",
      role: "student",
    },
  });

  // Enrollments for demo student
  console.log("📚 Adding enrollments for demo student…");
  const enrolledSlugs = ["data-structures-using-cpp", "database-management-systems", "operating-systems"];
  for (const slug of enrolledSlugs) {
    const course = await prisma.course.findUnique({ where: { slug } });
    if (course) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          courseId: course.id,
          progress: Math.floor(Math.random() * 100),
        },
      });
    }
  }

  // Live classes
  for (const lc of liveClasses) {
    await prisma.liveClass.upsert({
      where: { id: lc.id },
      update: {},
      create: {
        id: lc.id,
        title: lc.title,
        topic: lc.topic,
        startsAt: new Date(lc.startsAt),
        endsAt: new Date(lc.endsAt),
        status: lc.status === "Ongoing" ? "Ongoing" : lc.status,
        instructorId: lc.instructor.id,
      },
    });
  }

  // Orders
  for (const o of orders) {
    await prisma.order.create({
      data: {
        amount: o.amount,
        status: o.status,
        course: o.course,
        createdAt: new Date(o.date),
        userId: user.id,
      },
    });
  }

  // Announcements
  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {},
      create: { id: a.id, title: a.title, body: a.body, tone: a.tone, date: new Date(a.date) },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
