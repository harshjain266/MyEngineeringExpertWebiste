"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Rocket, 
  MapPin, 
  GraduationCap, 
  Award, 
  Heart, 
  Quote, 
  ChevronRight,
  Monitor,
  Layout,
  Play
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient py-20 px-8 text-center text-white shadow-glow">
        <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:32px_32px] opacity-20" />
        <motion.div {...fadeIn} className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur-md">
            ABOUT US
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold sm:text-6xl">
            Empowering the Next <br />
            <span className="text-brand-200">Generation of Engineers</span>
          </h1>
          <p className="mt-6 text-lg text-white/85 sm:text-xl leading-relaxed">
            EngineeringExpert is more than just a platform—it&apos;s a mission to redefine technical education for B.Tech students across India. We believe every engineer deserves access to the highest quality guidance, whether they&apos;re mastering semester fundamentals or preparing for top-tier placements.
          </p>
        </motion.div>
      </section>

      {/* Deep Encouragement Section */}
      <motion.section {...fadeIn} className="text-center px-4">
        <h2 className="font-display text-3xl font-bold text-ink">Built for the B.Tech Journey</h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-ink-soft leading-relaxed">
          The path from a student to a professional engineer is demanding. We focus exclusively on the challenges you face—from complex circuit analysis and data structures to the latest in AI/ML. Our goal is to ensure that no engineering dream is limited by the quality of instruction, making expert-led learning affordable, accessible, and deeply impactful for every Bharat engineer.
        </p>
      </motion.section>

      {/* Mission & Vision */}
      <section className="grid gap-8 md:grid-cols-2">
        <motion.div 
          {...fadeIn}
          className="group rounded-3xl border border-surface-muted bg-white p-8 shadow-soft transition-all hover:shadow-card"
        >
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-transform group-hover:rotate-6">
            <Target size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Our Mission</h2>
          <ul className="mt-6 space-y-4 text-ink-soft">
            {[
              "To aim for equity and inclusivity in education",
              "To reach learners in every corner of the country",
              "To build business sustainability through impact"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="mt-1 shrink-0 text-brand-600" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          {...fadeIn}
          className="group rounded-3xl border border-surface-muted bg-white p-8 shadow-soft transition-all hover:shadow-card"
        >
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:-rotate-6">
            <Rocket size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Our Vision</h2>
          <ul className="mt-6 space-y-4 text-ink-soft">
            {[
              "To democratize education at scale in India",
              "To ensure every child has access to quality education at affordable costs",
              "To allow every child to realize their true potential"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="mt-1 shrink-0 text-amber-600" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Stats Footprint */}
      <section className="rounded-[2.5rem] bg-ink py-16 px-8 text-white">
        <motion.div {...fadeIn} className="text-center">
          <h2 className="font-display text-3xl font-bold">Our Presence</h2>
          <p className="mt-2 text-white/60">Extending across the length and breadth of the country</p>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: "Cities", value: "100+", icon: MapPin },
            { label: "Centers", value: "120+", icon: Layout },
            { label: "Exam Categories", value: "28", icon: GraduationCap },
            { label: "Happy Students", value: "15M+", icon: Heart }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={fadeIn}
              className="rounded-2xl bg-white/5 p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <stat.icon className="mx-auto mb-4 text-brand-400" size={32} />
              <div className="font-display text-3xl font-extrabold">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Founders Section */}
      <section className="space-y-12">
        <motion.div {...fadeIn} className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink">Meet Our Founders</h2>
          <p className="mt-2 text-ink-muted">The visionaries behind EngineeringExpert</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              name: "XYZ",
              role: "Founder and CEO",
              quote: "My aim is to democratize and transform the education landscape in Bharat.",
              avatar: "https://i.pravatar.cc/300?img=11",
              color: "bg-brand-50"
            },
            {
              name: "XYZ",
              role: "Co-Founder",
              quote: "Teachers add soul into technology, which is why education comes before technology.",
              avatar: "https://i.pravatar.cc/300?img=12",
              color: "bg-indigo-50"
            }
          ].map((founder, i) => (
            <motion.div 
              key={i}
              {...fadeIn}
              className="flex flex-col items-center gap-6 rounded-[2rem] border border-surface-muted bg-white p-8 text-center transition-all hover:shadow-xl md:flex-row md:text-left"
            >
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white shadow-lg">
                <Image src={founder.avatar} alt={founder.name} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                <Quote className="text-brand-200" size={32} />
                <p className="font-medium italic text-ink-soft">
                  &quot;{founder.quote}&quot;
                </p>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{founder.name}</h3>
                  <p className="text-sm text-ink-muted">{founder.role}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  Read More
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <motion.section 
        {...fadeIn}
        className="rounded-[2.5rem] bg-brand-50 p-8 text-center sm:p-16"
      >
        <h2 className="font-display text-3xl font-bold text-ink">Join 15 Million students today!</h2>
        <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
          We understand that every student has unique needs and abilities, that&apos;s why our curriculum 
          is designed to adapt to your needs and help you grow!
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" className="rounded-full px-8">
            <Monitor className="mr-2" size={18} /> Download App
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8">
            <Play className="mr-2" size={18} /> Free Demo
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
