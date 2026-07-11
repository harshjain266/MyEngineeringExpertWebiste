import { prisma } from '@/lib/db';

async function main() {
  const courses = await prisma.course.findMany({ take: 3 });
  const instructors = await prisma.instructor.findMany({ take: 1 });

  if (courses.length === 0 || instructors.length === 0) {
    console.log('Need at least one course and one instructor in the DB to seed.');
    return;
  }

  const now = new Date();
  const classes = [];

  for (const course of courses) {
    classes.push({
      title: `${course.title} - Session 1`,
      topic: 'Core Concepts and Overview',
      subject: 'Phase 1: Foundations',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 2),
      endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 4),
      status: 'Upcoming' as const,
      instructorId: instructors[0].id,
      courseId: course.id
    });

    classes.push({
      title: `${course.title} - Session 2`,
      topic: 'Deep Dive into Subject Matter',
      subject: 'Phase 1: Foundations',
      meetingUrl: 'https://meet.google.com/xyz-qprs-tuv',
      startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 3),
      endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 5),
      status: 'Upcoming' as const,
      instructorId: instructors[0].id,
      courseId: course.id
    });

    classes.push({
      title: `${course.title} - Advanced Workshop`,
      topic: 'Real-world Project Implementation',
      subject: 'Phase 2: Practical Application',
      meetingUrl: 'https://meet.google.com/mno-pjkl-xyz',
      startsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 4),
      endsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 6),
      status: 'Upcoming' as const,
      instructorId: instructors[0].id,
      courseId: course.id
    });
  }

  await prisma.liveClass.createMany({ data: classes });
  console.log(`Successfully seeded ${classes.length} live classes across ${courses.length} courses.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
