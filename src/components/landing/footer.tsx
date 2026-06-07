import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Exams",
    links: ["GATE", "Placements", "PSU Exams", "Core Engineering", "EE Skills"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Blog", "Press", "Contact"],
  },
  {
    title: "Support",
    links: ["Help Center", "Refund Policy", "Terms of Service", "Privacy Policy"],
  },
];

const SOCIALS = [Twitter, Instagram, Linkedin, Youtube, Facebook];

export function Footer() {
  return (
    <footer className="border-t border-surface-muted bg-white">
      <div className="container-px py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              India&apos;s outcome-focused learning platform for engineering. Live classes,
              structured courses and doubt support — all in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-surface-muted text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  aria-label="social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-ink-muted transition-colors hover:text-brand-700"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-surface-muted pt-6 text-sm text-ink-muted sm:flex-row">
          <span>© {new Date().getFullYear()} EngineeringExpert. All rights reserved.</span>
          <span>Made with 💜 for engineers in India.</span>
        </div>
      </div>
    </footer>
  );
}
