"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { EmptyState } from "@/components/empty-state";
import { BadgeCheck, BookOpen, Briefcase, CheckCircle2, ExternalLink, Flag, GraduationCap, Rocket, Trophy } from "lucide-react";
import type { TimelineEvent } from "@/db/queries";
import { eventYear, formatMonthDay } from "@/lib/dates";
import { RepoLink } from "@/components/repo-link";
import { cn } from "@/lib/utils";

const MILESTONE_STYLES = {
  education: { icon: GraduationCap, label: "Education" },
  certification: { icon: BadgeCheck, label: "Certification" },
  work: { icon: Briefcase, label: "Work" },
  award: { icon: Trophy, label: "Award" },
  other: { icon: Flag, label: "Milestone" },
} as const;

function eventStyle(event: TimelineEvent) {
  switch (event.kind) {
    case "milestone":
      return MILESTONE_STYLES[event.milestoneType ?? "other"];
    case "book":
      return { icon: BookOpen, label: "Book" };
    case "project-started":
      return { icon: Rocket, label: "Project" };
    case "project-completed":
      return { icon: CheckCircle2, label: "Shipped" };
  }
}

function groupByYear(events: TimelineEvent[]) {
  const groups: { year: string; events: TimelineEvent[] }[] = [];
  for (const event of events) {
    const year = eventYear(event.date);
    const last = groups.at(-1);
    if (last?.year === year) last.events.push(event);
    else groups.push({ year, events: [event] });
  }
  return groups;
}

type Props = {
  events: TimelineEvent[];
  emptyMessage?: string;
  /** Narrow columns (the dashboard, the landing sample): dates sit above titles instead of in a gutter. */
  compact?: boolean;
  /** Draw the line and fade entries in on page load (landing page only). */
  animateIn?: boolean;
};

/**
 * The timeline is the centre of a profile, so it's set like a record rather than a feed:
 * each year is a large heading on the line, and entries are plain rows hanging off it.
 * Things that are done (milestones, shipped projects) get a filled blue node.
 */
export function Timeline({ events, emptyMessage, compact = false, animateIn = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // The line fills in blue as you scroll down through it.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  if (events.length === 0) {
    return <EmptyState compact art="milestones" title="Nothing on the timeline yet" description={emptyMessage} />;
  }

  // Grid columns: [date gutter] node | content. The line runs down the node column's centre.
  const cols = compact ? "grid-cols-[1.75rem_minmax(0,1fr)]" : "grid-cols-[1.75rem_minmax(0,1fr)] sm:grid-cols-[4rem_1.75rem_minmax(0,1fr)]";
  const lineX = compact ? "left-[0.875rem]" : "left-[0.875rem] sm:left-[5.875rem]";
  let order = 0;

  return (
    <div ref={ref} className="relative">
      <span aria-hidden className={cn("absolute top-3 bottom-3 w-px -translate-x-1/2 bg-border", lineX, animateIn && "animate-draw-down")} />
      {!animateIn && !reduceMotion && (
        <motion.span
          aria-hidden
          className={cn("absolute top-3 bottom-3 w-px -translate-x-1/2 origin-top bg-mark", lineX)}
          style={{ scaleY: progress }}
        />
      )}

      <div className="space-y-10">
        {groupByYear(events).map(({ year, events: yearEvents }) => (
          <section key={year} aria-label={year}>
            <div className={cn("grid items-center gap-x-4", cols)}>
              {!compact && <span className="hidden sm:block" />}
              <span aria-hidden className="relative mx-auto h-2.5 w-2.5 rounded-full bg-foreground ring-4 ring-background" />
              <h3 className={cn("font-display tabular-nums", compact ? "text-3xl" : "text-4xl sm:text-5xl")}>{year}</h3>
            </div>

            <ol className="mt-5 space-y-6">
              {yearEvents.map((event) => {
                const { icon: Icon, label } = eventStyle(event);
                const done = event.kind === "milestone" || event.kind === "project-completed";
                const day = formatMonthDay(event.date);
                const style: CSSProperties | undefined = animateIn ? { animationDelay: `${0.5 + order++ * 0.2}s` } : undefined;

                return (
                  <li key={event.key} className={cn("grid gap-x-4", cols, animateIn && "animate-appear")} style={style}>
                    {!compact && (
                      <time dateTime={event.date} className="hidden pt-1 text-right text-sm tabular-nums text-muted-foreground sm:block">
                        {day}
                      </time>
                    )}
                    <span
                      className={cn(
                        "relative flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background",
                        done ? "bg-mark text-mark-foreground" : "border bg-background text-muted-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    <div className="min-w-0 break-words pt-0.5">
                      <time dateTime={event.date} className={cn("block text-xs tabular-nums text-muted-foreground", !compact && "sm:hidden")}>
                        {day}
                      </time>
                      <span className="sr-only">{label}: </span>
                      {event.href ? (
                        <Link href={event.href} className="font-semibold leading-snug underline-offset-4 hover:underline">
                          {event.title}
                        </Link>
                      ) : (
                        <p className="font-semibold leading-snug">{event.title}</p>
                      )}
                      {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
                      {event.description && <p className="mt-1 max-w-prose text-sm text-muted-foreground line-clamp-3">{event.description}</p>}
                      {event.concepts && event.concepts.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Applied{" "}
                          {event.concepts.map((c, i) => (
                            <span key={c.id}>
                              {i > 0 && (i === event.concepts!.length - 1 ? " and " : ", ")}
                              <Link href={`/concepts/${c.id}`} className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                                {c.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
                      {event.repoUrl && <RepoLink url={event.repoUrl} className="mt-2" />}
                      {event.link && (
                        <a href={event.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center text-sm font-medium underline-offset-4 hover:underline">
                          View credential <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
