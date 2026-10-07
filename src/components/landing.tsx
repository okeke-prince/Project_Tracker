"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Lift, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArrowRight, BadgeCheck, BookOpen, Compass, GraduationCap, Lock, Rocket, Share2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClaimUsername } from "@/components/claim-username";

export type FeaturedProfile = {
  username: string;
  name: string | null;
  image: string | null;
  headline: string | null;
  books: number;
  projects: number;
  concepts: number;
  milestones: number;
};

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
const steps = [
  { icon: UserPlus, title: "Claim your link", text: "Pick a username and get your own page at yoursite.com/yourname." },
  { icon: GraduationCap, title: "Add your journey", text: "Log milestones, books, concepts and projects, and link them together." },
  { icon: Share2, title: "Share it", text: "Put the link in your CV, LinkedIn or GitHub so people see everything you've covered." },
];

const headline = "Show people what you've been".split(" ");
const accent = "up to.".split(" ");

export function Landing({ featured, host }: { featured: FeaturedProfile[]; host: string }) {
  return (
    <div className="relative max-w-5xl mx-auto py-6 sm:py-16 space-y-16 sm:space-y-24">

      <section className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center [&>*]:min-w-0">
        <div className="space-y-7">
          <Reveal>
            <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
              Your journey, in one link
            </span>
          </Reveal>

          <h1 className="text-[2.6rem] sm:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
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
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              A public timeline of your milestones, the books you&apos;ve read, the concepts you&apos;ve learned and
              the projects where you applied them, so anyone can get to know you.
            </p>
          </Reveal>

          <Reveal delay={0.65}>
            <ClaimUsername host={host} />
            <p className="mt-3 pl-5 text-sm text-muted-foreground">
              Already have one?{" "}
              <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </Reveal>
        </div>

        {/* A small sample timeline that builds itself, so visitors see what they'll get. */}
        <div className="relative rounded-2xl border bg-muted/60 p-4 sm:p-6 backdrop-blur-sm dark:bg-card/50">
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
                    <p className="text-sm font-medium leading-snug text-pretty">{item.title}</p>
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

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
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

      <section className="space-y-8">
        <Reveal>
          <SectionHeading eyebrow="How it works" title={<>Three steps to your <span className="text-accent-serif text-[1.1em]">timeline</span></>} />
        </Reveal>
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3 [&>*]:min-w-0">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <StaggerItem key={title}>
              <div className="relative h-full rounded-xl border border-dashed p-6">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <Icon className="mt-4 h-5 w-5" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {featured.length > 0 && (
        <section className="space-y-8">
          <Reveal>
            <SectionHeading eyebrow="Featured" title={<>See what people have been <span className="text-accent-serif text-[1.1em]">up to</span></>} />
          </Reveal>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
            {featured.map((p) => (
              <StaggerItem key={p.username}>
                <Lift className="h-full">
                  <Link href={`/${p.username}`} className="surface group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 dark:bg-card/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={p.image || ""} alt={p.name || p.username} />
                        <AvatarFallback>{(p.name || p.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.name || p.username}</p>
                        <p className="font-mono text-xs text-muted-foreground">@{p.username}</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    {p.headline && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.headline}</p>}
                    <div className="mt-auto flex gap-4 pt-4 font-mono text-[11px] text-muted-foreground">
                      <span>{p.books} books</span>
                      <span>{p.concepts} concepts</span>
                      <span>{p.projects} projects</span>
                    </div>
                  </Link>
                </Lift>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <Reveal>
        <div className="flex items-start gap-4 rounded-xl border bg-muted/50 p-5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Your files stay yours.</span>{" "}
            People can see which books you&apos;ve read, but your book files, reading progress and notes are never public.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <section className="text-center space-y-5 py-6">
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-balance">
            Start your <span className="text-accent-serif text-[1.1em]">timeline</span> today.
          </h2>
          <Link href="/register" className={`${buttonVariants({ size: "lg" })} group`}>
            Create your timeline
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </Reveal>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-foreground" />
          <span>Knowledge Tracker</span>
        </div>
        <nav className="flex gap-6">
          <Link href="/register" className="hover:text-foreground transition-colors">Sign up</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          <a href="https://github.com/okeke-prince" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </nav>
        <span className="font-mono text-xs">© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">{title}</h2>
    </div>
  );
}
