import type { Program } from "@/types";

/**
 * Program taxonomy for the "All Courses" mega-menu.
 *
 * Each `Course.program` references one of these slugs. Kept as plain config
 * (not in the DB) so both the client navbar and server pages can import it
 * without pulling in the data layer.
 */
export const PROGRAMS: Program[] = [
  {
    slug: "btech_bca",
    name: "BTECH / BCA",
    group: "Degree Programs",
    blurb: "Semester-aligned courses for B.Tech & BCA students.",
    audience: "For B.Tech / BCA students",
    icon: "🎓",
    accent: "from-violet-100 to-violet-50",
  },
  {
    slug: "dsa",
    name: "DSA",
    group: "Placement Prep",
    blurb: "Master Data Structures & Algorithms for interviews.",
    audience: "For placement & interview aspirants",
    icon: "🧩",
    accent: "from-emerald-100 to-emerald-50",
  },
  {
    slug: "aptitude",
    name: "Aptitude & Reasoning",
    group: "Placement Prep",
    blurb: "Quant, logical reasoning & verbal for aptitude rounds.",
    audience: "For placement aptitude rounds",
    icon: "🧠",
    accent: "from-amber-100 to-amber-50",
  },
  {
    slug: "gate",
    name: "GATE",
    group: "Competitive Exams",
    blurb: "Complete GATE CS/IT preparation with PYQs & tests.",
    audience: "For GATE aspirants",
    icon: "🎯",
    accent: "from-rose-100 to-rose-50",
  },
  {
    slug: "web_dev",
    name: "Web Development",
    group: "Skills",
    blurb: "Full-stack web development — frontend to backend.",
    audience: "For aspiring web developers",
    icon: "💻",
    accent: "from-sky-100 to-sky-50",
  },
];

export const PROGRAM_BY_SLUG: Record<string, Program> = Object.fromEntries(
  PROGRAMS.map((p) => [p.slug, p]),
);

/** Programs grouped by their `group` heading, preserving definition order. */
export function programsByGroup(): { group: string; programs: Program[] }[] {
  const order: string[] = [];
  const map = new Map<string, Program[]>();
  for (const p of PROGRAMS) {
    if (!map.has(p.group)) {
      map.set(p.group, []);
      order.push(p.group);
    }
    map.get(p.group)!.push(p);
  }
  return order.map((group) => ({ group, programs: map.get(group)! }));
}
