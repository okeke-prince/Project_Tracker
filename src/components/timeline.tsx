"use client";

import { Fragment, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BadgeCheck, BookOpen, Briefcase, CheckCircle2, ExternalLink, Flag, GraduationCap, Rocket, Trophy } from "lucide-react";
import type { TimelineEvent } from "@/db/queries";
import { formatEventDate } from "@/lib/dates";
import { RepoLink } from "@/components/repo-link";

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

const EASE = [0.22, 1, 0.36, 1] as const;

export function Timeline({ events, emptyMessage }: { events: TimelineEvent[]; emptyMessage?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  // The rail fills in as you scroll down through the timeline.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  if (events.length === 0) {
    return (
      <EmptyState compact art="milestones" title="Nothing on the timeline yet" description={emptyMessage} />
    );
  }

  return (
    <ol ref={ref} className="relative ml-4 space-y-5">
      <span aria-hidden className="absolute left-0 top-2 bottom-2 w-px bg-border" />
      <motion.span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-px origin-top bg-foreground/60"
        style={{ scaleY: progress }}
      />

      {events.map((event, i) => {
        const { icon: Icon, label } = eventStyle(event);
        const year = formatEventDate(event.date).slice(-4);
        const showYear = i === 0 || formatEventDate(events[i - 1].date).slice(-4) !== year;
        const highlight = event.kind === "milestone" || event.kind === "project-completed";

        return (
          <Fragment key={event.key}>
            {showYear && (
              <motion.li
                className="relative pl-8 pt-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="absolute -left-[3px] top-[1.15rem] h-[7px] w-[7px] rounded-full bg-foreground/60" />
                <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground">{year}</span>
              </motion.li>
            )}
            <motion.li
              className="relative min-w-0 pl-8"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <motion.span
                className={`absolute -left-[18px] top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-background ${highlight ? "border-foreground/30" : ""}`}
                initial={{ scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              >
                <Icon className={`h-4 w-4 ${highlight ? "text-foreground" : "text-muted-foreground"}`} />
              </motion.span>

              <motion.div
                className="surface group min-w-0 break-words rounded-xl border bg-card p-4 backdrop-blur-sm dark:bg-card/60 transition-colors hover:border-foreground/20 hover:bg-card"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
                  <time className="shrink-0 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{formatEventDate(event.date)}</time>
                </div>
                {event.href ? (
                  <Link href={event.href} className="font-semibold leading-snug underline-offset-4 group-hover:underline">
                    {event.title}
                  </Link>
                ) : (
                  <p className="font-semibold leading-snug">{event.title}</p>
                )}
                {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
                {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{event.description}</p>}
                {event.concepts && event.concepts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-xs text-muted-foreground">Applied</span>
                    {event.concepts.map((c) => (
                      <Link key={c.id} href={`/concepts/${c.id}`}>
                        <Badge variant="secondary" className="text-xs transition-colors hover:bg-foreground hover:text-background">{c.name}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
                {event.repoUrl && <RepoLink url={event.repoUrl} className="mt-3" />}
                {event.link && (
                  <a href={event.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs font-medium underline-offset-4 hover:underline">
                    View credential <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </motion.div>
            </motion.li>
          </Fragment>
        );
      })}
    </ol>
  );
}
