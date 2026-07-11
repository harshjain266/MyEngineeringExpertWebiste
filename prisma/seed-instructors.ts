import { prisma } from '@/lib/db';

async function main() {
  const instructorEmails = [
    'jaainharsh383@gmail.com',
    'jaainharsh384@gmail.com',
  ];

  for (const email of instructorEmails) {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'instructor' },
    }).catch((e: any) => {
      console.error(`User with email ${email} not found:`, e);
      return null;
    });

    if (!user) continue;

    // Upsert linked instructor profile
    await prisma.instructor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: user.name || 'Instructor',
        title: 'Instructor',
        avatar: user.avatar,
        rating: 0,
        students: 0,
      },
    });

    console.log(`Promoted ${email} to instructor and ensured profile exists.`);
  }
}

main()
  .then(() => {
    console.log('Seeding complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
