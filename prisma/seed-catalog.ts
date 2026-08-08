/**
 * Catalog seed — writes the real program catalog into Postgres.
 *
 * - Assigns each existing course to a program (BTECH/BCA, DSA, GATE, …).
 * - Adds the instructors and courses that populate the new programs.
 *
 * Idempotent: safe to re-run. Run with: npx tsx prisma/seed-catalog.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** program slug for each existing course, keyed by slug */
const PROGRAM_BY_COURSE: Record<string, string> = {
  "data-structures-using-cpp": "dsa",
  "database-management-systems": "btech_bca",
  "operating-systems": "gate",
  "computer-networks": "gate",
  "engineering-mathematics-ii": "btech_bca",
  "object-oriented-programming-java": "btech_bca",
  "digital-electronics": "gate",
  "software-engineering": "btech_bca",
};

const NEW_INSTRUCTORS = [
  {
    id: "ins_sahil",
    name: "Prof. Sahil Mehta",
    title: "Full-Stack Web Development",
    avatar: "https://i.pravatar.cc/120?img=68",
    rating: 4.8,
    students: 38600,
  },
  {
    id: "ins_divya",
    name: "Prof. Divya Rao",
    title: "Aptitude & Reasoning",
    avatar: "https://i.pravatar.cc/120?img=20",
    rating: 4.7,
    students: 29750,
  },
];

const NEW_COURSES = [
  {
    id: "crs_dsa_interview",
    slug: "complete-dsa-for-interviews",
    title: "Complete DSA for Interviews",
    category: "Computer Science",
    program: "dsa",
    level: "Intermediate" as const,
    instructorId: "ins_rohit",
    price: 2999,
    originalPrice: 4999,
    rating: 4.8,
    ratingCount: 1240,
    durationHours: 60,
    lectures: 180,
    language: "Hinglish",
    thumbnail:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=60",
    badge: "Bestseller",
    tags: ["DSA", "Interview", "FAANG"],
  },
  {
    id: "crs_cp",
    slug: "competitive-programming-masterclass",
    title: "Competitive Programming Masterclass",
    category: "Computer Science",
    program: "dsa",
    level: "Advanced" as const,
    instructorId: "ins_rohit",
    price: 3499,
    originalPrice: 5999,
    rating: 4.7,
    ratingCount: 540,
    durationHours: 70,
    lectures: 150,
    language: "English",
    thumbnail:
      "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=800&q=60",
    badge: "New",
    tags: ["CP", "Codeforces", "Algorithms"],
  },
  {
    id: "crs_fullstack",
    slug: "full-stack-web-development-mern",
    title: "Full-Stack Web Development (MERN)",
    category: "Information Technology",
    program: "web-dev",
    level: "Beginner" as const,
    instructorId: "ins_sahil",
    price: 3999,
    originalPrice: 6999,
    rating: 4.8,
    ratingCount: 980,
    durationHours: 90,
    lectures: 220,
    language: "Hinglish",
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=60",
    badge: "Bestseller",
    tags: ["MongoDB", "Express", "React", "Node"],
  },
  {
    id: "crs_react_next",
    slug: "react-and-nextjs-mastery",
    title: "React & Next.js Mastery",
    category: "Information Technology",
    program: "web-dev",
    level: "Intermediate" as const,
    instructorId: "ins_sahil",
    price: 2799,
    originalPrice: 4499,
    rating: 4.9,
    ratingCount: 612,
    durationHours: 48,
    lectures: 130,
    language: "English",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=60",
    badge: "New",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "crs_quant",
    slug: "quantitative-aptitude-complete",
    title: "Quantitative Aptitude Complete",
    category: "Computer Science",
    program: "aptitude",
    level: "Beginner" as const,
    instructorId: "ins_divya",
    price: 1499,
    originalPrice: 2999,
    rating: 4.6,
    ratingCount: 870,
    durationHours: 40,
    lectures: 120,
    language: "Hinglish",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=60",
    badge: "50% OFF",
    tags: ["Quant", "Placement", "Aptitude"],
  },
  {
    id: "crs_logical",
    slug: "logical-reasoning-and-verbal",
    title: "Logical Reasoning & Verbal Ability",
    category: "Computer Science",
    program: "aptitude",
    level: "Beginner" as const,
    instructorId: "ins_divya",
    price: 1299,
    originalPrice: 2499,
    rating: 4.5,
    ratingCount: 430,
    durationHours: 32,
    lectures: 96,
    language: "Hinglish",
    thumbnail:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=60",
    tags: ["Reasoning", "Verbal", "Placement"],
  },
];

async function main() {
  console.log("🌱 Seeding program catalog…");

  // 1) Assign programs to existing courses
  for (const [slug, program] of Object.entries(PROGRAM_BY_COURSE)) {
    await prisma.course.updateMany({ where: { slug }, data: { program } });
  }

  // 2) New instructors
  for (const ins of NEW_INSTRUCTORS) {
    await prisma.instructor.upsert({
      where: { id: ins.id },
      update: { name: ins.name, title: ins.title, avatar: ins.avatar, rating: ins.rating, students: ins.students },
      create: ins,
    });
  }

  // 3) New courses
  for (const c of NEW_COURSES) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: { program: c.program, price: c.price, originalPrice: c.originalPrice },
      create: c,
    });
  }

  const counts = await prisma.course.groupBy({ by: ["program"], _count: true });
  console.log("✅ Catalog seeded. Courses per program:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
