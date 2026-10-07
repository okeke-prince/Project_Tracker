import { Fragment } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, BookOpen, Briefcase, CheckCircle2, ExternalLink, Flag, GraduationCap, Rocket, Trophy } from "lucide-react";
import type { TimelineEvent } from "@/db/queries";

const MILESTONE_STYLES = {
  education: { icon: GraduationCap, label: "Education", color: "text-violet-500" },
  certification: { icon: BadgeCheck, label: "Certification", color: "text-amber-500" },
  work: { icon: Briefcase, label: "Work", color: "text-sky-500" },
  award: { icon: Trophy, label: "Award", color: "text-rose-500" },
  other: { icon: Flag, label: "Milestone", color: "text-muted-foreground" },
} as const;

function eventStyle(event: TimelineEvent) {
  switch (event.kind) {
    case "milestone":
      return MILESTONE_STYLES[event.milestoneType ?? "other"];
    case "book":
      return { icon: BookOpen, label: "Book", color: "text-emerald-500" };
    case "project-started":
      return { icon: Rocket, label: "Project", color: "text-sky-500" };
    case "project-completed":
      return { icon: CheckCircle2, label: "Project", color: "text-emerald-500" };
  }
}

export function formatEventDate(date: string) {
  // Plain YYYY-MM-DD dates are calendar days; parse them as UTC so they don't shift a day.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function Timeline({ events, emptyMessage }: { events: TimelineEvent[]; emptyMessage?: string }) {
  if (events.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl border-dashed">
        <p className="text-muted-foreground">{emptyMessage ?? "Nothing on the timeline yet."}</p>
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border ml-4 space-y-6">
      {events.map((event, i) => {
        const style = eventStyle(event);
        const Icon = style.icon;
        const year = formatEventDate(event.date).slice(-4);
        const showYear = i === 0 || formatEventDate(events[i - 1].date).slice(-4) !== year;

        return (
          <Fragment key={event.key}>
            {showYear && (
              <li className="ml-8 pt-2">
                <span className="absolute -left-[0.3rem] mt-1.5 h-2.5 w-2.5 rounded-full bg-border" />
                <span className="text-sm font-semibold text-muted-foreground">{year}</span>
              </li>
            )}
          <li className="ml-8">
            <span className="absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm">
              <Icon className={`h-4 w-4 ${style.color}`} />
            </span>
            <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{style.label}</span>
                <time className="text-xs font-medium text-muted-foreground whitespace-nowrap">{formatEventDate(event.date)}</time>
              </div>
              {event.href ? (
                <Link href={event.href} className="font-semibold hover:text-primary transition-colors">
                  {event.title}
                </Link>
              ) : (
                <p className="font-semibold">{event.title}</p>
              )}
              {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
              {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{event.description}</p>}
              {event.concepts && event.concepts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-xs text-muted-foreground">Applied:</span>
                  {event.concepts.map((c) => (
                    <Link key={c.id} href={`/concepts/${c.id}`}>
                      <Badge variant="secondary" className="text-xs hover:bg-primary/10">{c.name}</Badge>
                    </Link>
                  ))}
                </div>
              )}
              {event.link && (
                <a href={event.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs text-primary hover:underline">
                  View credential <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
