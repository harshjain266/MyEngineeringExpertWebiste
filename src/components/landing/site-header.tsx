import { getPrograms, getCoursesByProgram } from "@/lib/data";
import { Navbar, type MenuGroup } from "@/components/landing/navbar";

/**
 * Server wrapper that assembles the "All Courses" mega-menu (programs + a
 * preview of each program's courses, straight from the DB) and hands it to the
 * client <Navbar>. Use this in any page that needs the site header.
 */
export async function SiteHeader() {
  const programs = await getPrograms();

  const withCourses = await Promise.all(
    programs.map(async (p) => ({
      program: p,
      courses: (await getCoursesByProgram(p.slug)).map((c) => ({
        slug: c.slug,
        title: c.title,
      })),
    })),
  );

  // Group programs by their `group` heading, preserving order.
  const order: string[] = [];
  const byGroup = new Map<string, MenuGroup["programs"]>();
  for (const { program, courses } of withCourses) {
    if (!byGroup.has(program.group)) {
      byGroup.set(program.group, []);
      order.push(program.group);
    }
    byGroup.get(program.group)!.push({
      slug: program.slug,
      name: program.name,
      icon: program.icon,
      blurb: program.blurb,
      audience: program.audience,
      accent: program.accent,
      courses,
    });
  }

  const menu: MenuGroup[] = order.map((group) => ({
    group,
    programs: byGroup.get(group)!,
  }));

  return <Navbar menu={menu} />;
}
