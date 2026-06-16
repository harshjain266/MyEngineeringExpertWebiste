import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: "jaainharsh383@gmail.com" },
    include: {
      enrollments: {
        include: { course: true }
      }
    }
  });
  console.log(JSON.stringify(user, null, 2));
}

checkUser().finally(() => prisma.$disconnect());
