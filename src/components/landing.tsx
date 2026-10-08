"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClaimUsername } from "@/components/claim-username";
import { LogoMark } from "@/components/logo";
import { Timeline } from "@/components/timeline";
import type { TimelineEvent } from "@/db/queries";
import { plural } from "@/lib/status";

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

// The hero shows the product itself: a short timeline, drawn by the same component profiles use.
const sample: TimelineEvent[] = [
  { key: "s1", kind: "milestone", milestoneType: "certification", date: "2026-03-20", title: "AWS Certified Solutions Architect" },
  { key: "s2", kind: "book", date: "2026-01-18", title: "Finished reading Designing Data-Intensive Applications", subtitle: "Martin Kleppmann" },
  { key: "s3", kind: "project-completed", date: "2025-06-14", title: "Shipped Caching Proxy", description: "Applied CQRS and cache invalidation." },
  { key: "s4", kind: "milestone", milestoneType: "education", date: "2024-07-15", title: "Graduated, BSc Computer Science" },
];

const steps = [
  { title: "Pick your link", text: "Choose a username and your page lives at that address." },
  { title: "Add what you've done", text: "Milestones, books, concepts and projects, linked to each other." },
  { title: "Share it", text: "Put the link on your CV, LinkedIn or GitHub." },
];

export function Landing({ featured, host }: { featured: FeaturedProfile[]; host: string }) {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-14 space-y-20 sm:space-y-28">
      <section className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
        <div>
          <h1 className="font-display text-[3.4rem] text-balance sm:text-7xl lg:text-[6.25rem]">
            Show people what you&apos;ve been up to.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            One public page for the milestones you&apos;ve reached, the books you&apos;ve finished and the projects
            you&apos;ve shipped, in the order they happened.
          </p>
          <div className="mt-8">
            <ClaimUsername host={host} />
            <p className="mt-3 text-sm text-muted-foreground">
              Already have a page?{" "}
              <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

        <figure className="lg:pt-4">
          <Timeline events={sample} compact animateIn />
          <figcaption className="mt-6 text-sm text-muted-foreground">An example page. Yours fills in as you add things.</figcaption>
        </figure>
      </section>

      <section>
        <h2 className="border-b pb-3 text-lg font-semibold">How it works</h2>
        <ol className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map(({ title, text }, i) => (
            <li key={title}>
              <span className="font-display text-4xl text-muted-foreground/60">{i + 1}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="border-b pb-3 text-lg font-semibold">People keeping a timeline</h2>
          <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.username} className="border-b">
                <Link href={`/${p.username}`} className="group flex items-start gap-3 py-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.image || ""} alt={p.name || p.username} />
                    <AvatarFallback>{(p.name || p.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold underline-offset-4 group-hover:underline">{p.name || p.username}</p>
                    {p.headline && <p className="text-sm text-muted-foreground line-clamp-1">{p.headline}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plural(p.books, "book")}, {plural(p.concepts, "concept")} and {plural(p.projects, "project")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col items-start gap-5 border-t pt-12 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-4xl sm:text-5xl">Start yours.</h2>
        <Link href="/register" className={buttonVariants({ size: "lg" })}>Create your page</Link>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <LogoMark className="h-5 w-5" />
          <span>Knowledge Tracker</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/register" className="hover:text-foreground transition-colors">Sign up</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <a href="https://github.com/okeke-prince" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
