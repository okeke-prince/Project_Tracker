import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUserByUsername, getTimeline, getPublicLibrary } from "@/db/queries";
import { getCurrentUserId } from "@/lib/session";
import { Timeline } from "@/components/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Book as BookIcon, Compass, Folder, Milestone, Pencil, Star, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Profile not found" };
  const name = user.name || user.username;
  return {
    title: `${name} · Timeline`,
    description: user.headline || `What ${name} has been reading, learning and building.`,
  };
}

const statusColor: Record<string, string> = {
  finished: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  mastered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  reading: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  applied: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "in-progress": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};
const defaultColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const [viewerId, timeline, library] = await Promise.all([
    getCurrentUserId(),
    getTimeline(user.id),
    getPublicLibrary(user.id),
  ]);
  const isOwner = viewerId === user.id;
  const readingNow = library.books.filter((b) => b.status === "reading");
  const otherBooks = library.books.filter((b) => b.status !== "reading");
  const name = user.name || user.username!;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = [
    { label: "Books read", value: library.books.filter((b) => b.status === "finished").length },
    { label: "Concepts", value: library.concepts.length },
    { label: "Projects", value: library.projects.length },
    { label: "Milestones", value: timeline.filter((e) => e.kind === "milestone").length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <section className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <Avatar className="h-20 w-20 text-xl">
          <AvatarImage src={user.image || ""} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.headline && <p className="text-lg">{user.headline}</p>}
        </div>
        {isOwner && (
          <Link href="/manage?tab=profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="mr-2 h-3 w-3" /> Edit profile
          </Link>
        )}
      </section>

      {user.bio && <p className="text-muted-foreground whitespace-pre-line">{user.bio}</p>}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3 items-start">
        <Widget title="Timeline" icon={Milestone} className="lg:col-span-2 lg:row-span-3">
          <Timeline
            events={timeline}
            emptyMessage={isOwner ? "Add a milestone or finish a book in Manage to start your timeline." : `${name} hasn't added anything yet.`}
          />
        </Widget>

        <Widget title="Books" icon={BookIcon} count={library.books.length}>
          {readingNow.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reading now</p>
              {readingNow.map((book) => <BookRow key={book.id} book={book} />)}
            </div>
          )}
          <ShowMore
            items={otherBooks.map((book) => <BookRow key={book.id} book={book} />)}
            empty={readingNow.length === 0 ? "No books yet." : null}
          />
        </Widget>

        <Widget title="Concepts" icon={Compass} count={library.concepts.length}>
          {library.concepts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No concepts yet.</p>
          ) : (
            <div className="space-y-4">
              {(["mastered", "applied", "studied"] as const).map((status) => {
                const group = library.concepts.filter((c) => c.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{status} · {group.length}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.map((concept) => (
                        <Link key={concept.id} href={`/concepts/${concept.id}`} title={concept.shortDescription ?? undefined}>
                          <Badge variant="outline" className={`hover:border-primary/50 ${statusColor[status] ?? defaultColor}`}>{concept.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        <Widget title="Projects" icon={Folder} count={library.projects.length}>
          <ShowMore
            items={library.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-lg border p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{project.name}</span>
                  <Badge variant="outline" className={`capitalize text-[10px] shrink-0 ${statusColor[project.status] ?? defaultColor}`}>
                    {project.status.replace(/-/g, " ")}
                  </Badge>
                </div>
                {project.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>}
                {project.techStack && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {JSON.parse(project.techStack).slice(0, 4).map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-[10px] bg-muted/50">{tech}</Badge>
                    ))}
                  </div>
                )}
              </Link>
            ))}
            empty="No projects yet."
          />
        </Widget>
      </section>
    </div>
  );
}

// Widgets

function Widget({ title, icon: Icon, count, className, children }: {
  title: string;
  icon: LucideIcon;
  count?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`shadow-sm ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
        {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const PREVIEW_COUNT = 4;

// Shows the first few items and tucks the rest behind a native expander, so it needs no client JS.
function ShowMore({ items, empty }: { items: ReactNode[]; empty: string | null }) {
  if (items.length === 0) return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null;
  return (
    <div className="space-y-2">
      {items.slice(0, PREVIEW_COUNT)}
      {items.length > PREVIEW_COUNT && (
        <details className="group space-y-2">
          <summary className="cursor-pointer list-none text-sm text-primary hover:underline pt-1">
            <span className="group-open:hidden">Show all {items.length}</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className="space-y-2 pt-2">{items.slice(PREVIEW_COUNT)}</div>
        </details>
      )}
    </div>
  );
}

type PublicBook = Awaited<ReturnType<typeof getPublicLibrary>>["books"][number];

function BookRow({ book }: { book: PublicBook }) {
  return (
    <Link href={`/books/${book.id}`} className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors">
      <div className="min-w-0">
        <p className="font-medium text-sm line-clamp-1">{book.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.authors}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant="outline" className={`capitalize text-[10px] ${statusColor[book.status] ?? defaultColor}`}>
          {book.status.replace(/-/g, " ")}
        </Badge>
        {book.rating && (
          <div className="flex text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < book.rating! ? "fill-current" : "text-muted"}`} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
