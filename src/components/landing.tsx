"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArrowRight, BadgeCheck, BookOpen, Compass, GraduationCap, Rocket } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const features = [
  { icon: GraduationCap, title: "Milestones", text: "Graduations, certifications, new roles. The moments that shaped you, on one timeline." },
  { icon: BookOpen, title: "Books", text: "Show what you've read and what you're reading now. Your files and notes stay private." },
  { icon: Compass, title: "Concepts", text: "The patterns and ideas you've studied, applied and mastered." },
  { icon: Rocket, title: "Projects", text: "What you've built, and which concepts you put into practice." },
];

const preview = [
  { icon: BadgeCheck, label: "Certification", title: "AWS Certified Solutions Architect", date: "Mar 2026" },
  { icon: BookOpen, label: "Book", title: "Finished Designing Data-Intensive Applications", date: "Jan 2026" },
  { icon: Rocket, label: "Shipped", title: "Caching Proxy", date: "Jun 2025", tags: ["CQRS", "Caching"] },
  { icon: GraduationCap, label: "Education", title: "Graduated, BSc Computer Science", date: "Jul 2024" },
];

// The last words get the italic serif accent.
const headline = "Show people what you've been".split(" ");
const accent = "up to.".split(" ");

export function Landing() {
  return (
    <div className="relative max-w-5xl mx-auto py-10 sm:py-16 space-y-24">

      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-7">
          <Reveal>
            <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
              Your journey, in one link
            </span>
          </Reveal>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            {[...headline, ...accent].map((word, i) => (
              <motion.span
                key={i}
                className={`inline-block mr-[0.25em] ${i >= headline.length ? "text-accent-serif text-[1.1em]" : ""}`}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.06 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <Reveal delay={0.5}>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              A public timeline of your milestones, the books you&apos;ve read, the concepts you&apos;ve learned and
              the projects where you applied them, so anyone can get to know you.
            </p>
          </Reveal>

          <Reveal delay={0.65}>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={`${buttonVariants({ size: "lg" })} group`}>
                Create your timeline
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>Sign in</Link>
            </div>
          </Reveal>
        </div>

        {/* A small sample timeline that builds itself, so visitors see what they'll get. */}
        <div className="relative rounded-2xl border bg-muted/60 p-6 backdrop-blur-sm dark:bg-card/50">
          <div className="relative ml-3">
            <motion.span
              aria-hidden
              className="absolute left-0 top-1 bottom-1 w-px origin-top bg-foreground/40"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.4 }}
            />
            <ul className="space-y-4">
              {preview.map((item, i) => (
                <motion.li
                  key={item.title}
                  className="relative pl-7"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.6 + i * 0.25 }}
                >
                  <span className="absolute -left-[13px] top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border bg-background">
                    <item.icon className="h-3 w-3" />
                  </span>
                  <div className="surface rounded-lg border bg-card px-3 py-2.5 dark:bg-background/80">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {item.tags && (
                      <div className="mt-1.5 flex gap-1">
                        {item.tags.map((t) => (
                          <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Stagger className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, text }) => (
          <StaggerItem key={title}>
            <Lift className="h-full">
              <div className="surface h-full rounded-xl border bg-card p-6 transition-colors hover:border-foreground/20 dark:bg-card/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/60 dark:bg-background">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            </Lift>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
