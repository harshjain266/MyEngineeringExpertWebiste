/**
 * Non-destructive seed: creates/upgrades demo admin + superadmin accounts and
 * links existing teachers to an admin so you can test the ownership hierarchy.
 *
 *   npx tsx prisma/seed-roles.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Super admin — sees every admin, every teacher, can enable/disable admins.
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@email.com" },
    update: { role: "superadmin", emailVerified: new Date(), isDisabled: false },
    create: {
      name: "Super Admin",
      email: "superadmin@email.com",
      password: hashedPassword,
      emailVerified: new Date(),
      role: "superadmin",
      avatar: "https://i.pravatar.cc/160?img=58",
    },
  });
  console.log(`✅ Super admin ready: ${superAdmin.email} / password123`);

  // 2. A normal admin — only sees teachers assigned to them.
  const admin = await prisma.user.upsert({
    where: { email: "admin@email.com" },
    update: { role: "admin", emailVerified: new Date(), isDisabled: false },
    create: {
      name: "Platform Admin",
      email: "admin@email.com",
      password: hashedPassword,
      emailVerified: new Date(),
      role: "admin",
      avatar: "https://i.pravatar.cc/160?img=33",
    },
  });
  console.log(`✅ Admin ready: ${admin.email} / password123`);

  // 3. Optionally link the first few teachers to the admin so the admin
  //    dashboard is not empty. Change/remove emails as needed.
  const emailsToAssign = ["jaainharsh383@gmail.com", "jaainharsh384@gmail.com"];
  for (const email of emailsToAssign) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;
    const updated = await prisma.instructor.updateMany({
      where: { userId: user.id, adminId: null },
      data: { adminId: admin.id },
    });
    if (updated.count > 0) {
      console.log(`→ Assigned ${email} to ${admin.name}`);
    }
  }

  console.log("Seed complete. Log in as superadmin@email.com to manage admins.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
