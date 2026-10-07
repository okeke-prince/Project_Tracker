import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUserByUsername, getTimeline, getPublicLibrary, getKnowledgeGraph } from "@/db/queries";
import { getCurrentUserId } from "@/lib/session";
import { Timeline } from "@/components/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { RepoLink } from "@/components/repo-link";
import { LazyKnowledgeGraph } from "@/components/knowledge-graph";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, Book as BookIcon, Compass, Folder, Milestone, Network, Pencil, Star, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { params: Promise<{ username: string }> };

// /princeinme128 and /@princeinme128 both work.
const cleanUsername = (raw: string) => decodeURIComponent(raw).replace(/^@/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = cleanUsername((await params).username);
  const user = await getUserByUsername(username);
  if (!user) return { title: "Profile not found" };
  const name = user.name || user.username;
  const title = `${name} · Timeline`;
  const description = user.headline || `What ${name} has been reading, learning and building.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile", url: `/${user.username}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Monochrome status styles: done is solid, in progress is outlined, everything else is muted.
const DONE = "bg-foreground text-background border-transparent";
const ACTIVE = "border-foreground/40 text-foreground";
const statusColor: Record<string, string> = {
  finished: DONE,
  mastered: DONE,
  completed: DONE,
  reading: ACTIVE,
  applied: ACTIVE,
  "in-progress": ACTIVE,
};
const defaultColor = "text-muted-foreground";

export default async function ProfilePage({ params }: Props) {
  const username = cleanUsername((await params).username);
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const [viewerId, timeline, library, graph] = await Promise.all([
    getCurrentUserId(),
    getTimeline(user.id),
    getPublicLibrary(user.id),
    getKnowledgeGraph(user.id),
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
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
      <section className="relative pt-6 pb-4">
        <Stagger className="flex flex-col sm:flex-row gap-6 sm:items-end">
          <StaggerItem>
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 text-2xl ring-1 ring-border ring-offset-4 ring-offset-background">
              <AvatarImage src={user.image || ""} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </StaggerItem>
          <div className="flex-1 min-w-0 space-y-2">
            <StaggerItem>
              <p className="font-mono text-xs tracking-widest text-muted-foreground">@{user.username}</p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-[2.75rem] leading-none sm:text-6xl tracking-tight text-accent-serif break-words">{name}</h1>
            </StaggerItem>
            {user.headline && (
              <StaggerItem>
                <p className="text-lg text-muted-foreground">{user.headline}</p>
              </StaggerItem>
            )}
          </div>
          {isOwner && (
            <StaggerItem>
              <Link href="/manage?tab=profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Pencil className="mr-2 h-3 w-3" /> Edit profile
              </Link>
            </StaggerItem>
          )}
        </Stagger>

        {user.bio && (
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed whitespace-pre-line">{user.bio}</p>
          </Reveal>
        )}
      </section>

      <Stagger className="surface grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border bg-border">
        {stats.map((s) => (
          <StaggerItem key={s.label} className="bg-card p-4 sm:p-5 dark:bg-background">
            <CountUp value={s.value} className="block text-3xl font-semibold tabular-nums tracking-tight" />
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </StaggerItem>
        ))}
      </Stagger>

      <Widget title="Projects" icon={Folder} count={library.projects.length} delay={0.05}>
        <ShowMore
          layout="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          preview={6}
          items={library.projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          empty={isOwner ? "Add your first project in Manage so it shows up here." : "No projects yet."}
        />
      </Widget>

      {graph.nodes.length > 0 && (
        <Widget
          title="Knowledge map"
          icon={Network}
          delay={0.1}
          action={
            <Link href={`/${user.username}/map`} className="group inline-flex items-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Explore in 3D <ArrowUpRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          }
        >
          <p className="-mt-2 mb-3 text-sm text-muted-foreground">How {name}&apos;s concepts connect to the books that taught them and the projects that used them.</p>
          <Link href={`/${user.username}/map`} aria-label={`Explore ${name}'s knowledge map`} className="block h-[280px] overflow-hidden rounded-xl border bg-background/40 sm:h-[360px]">
            <LazyKnowledgeGraph nodes={graph.nodes} links={graph.links} compact />
          </Link>
        </Widget>
      )}

      <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 items-start [&>*]:min-w-0">
        <Widget title="Timeline" icon={Milestone} className="lg:col-span-2 lg:row-span-2" delay={0.05}>
          <Timeline
            events={timeline}
            emptyMessage={isOwner ? "Add a milestone or finish a book in Manage to start your timeline." : `${name} hasn't added anything yet.`}
          />
        </Widget>

        <Widget title="Books" icon={BookIcon} count={library.books.length} delay={0.15}>
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

        <Widget title="Concepts" icon={Compass} count={library.concepts.length} delay={0.25}>
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
                          <Badge variant="outline" className={`transition-transform hover:scale-105 ${statusColor[status] ?? defaultColor}`}>{concept.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

      </section>
    </div>
  );
}

// Widgets

function Widget({ title, icon: Icon, count, action, className, delay, children }: {
  title: string;
  icon: LucideIcon;
  count?: number;
  action?: ReactNode;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal className={className} delay={delay}>
      <Card className="surface shadow-none bg-card transition-colors hover:border-foreground/15 dark:bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <Icon className="h-4 w-4 text-foreground" /> {title}
          </CardTitle>
          {count !== undefined && (
            <span className="rounded-full border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{count}</span>
          )}
          {action}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Reveal>
  );
}

const PREVIEW_COUNT = 4;

// Shows the first few items and tucks the rest behind a native expander, so it needs no client JS.
function ShowMore({ items, empty, layout = "space-y-2", preview = PREVIEW_COUNT }: {
  items: ReactNode[];
  empty: string | null;
  layout?: string;
  preview?: number;
}) {
  if (items.length === 0) return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null;
  return (
    <div className="space-y-2">
      <div className={layout}>{items.slice(0, preview)}</div>
      {items.length > preview && (
        <details className="group space-y-2">
          <summary className="cursor-pointer list-none text-sm text-primary hover:underline pt-1">
            <span className="group-open:hidden">Show all {items.length}</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className={`pt-2 ${layout}`}>{items.slice(preview)}</div>
        </details>
      )}
    </div>
  );
}

type PublicProject = Awaited<ReturnType<typeof getPublicLibrary>>["projects"][number];

function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <div className="relative flex h-full flex-col rounded-lg border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Stretched link: the whole card opens the project, the repo link sits above it. */}
        <Link href={`/projects/${project.id}`} className="font-medium text-sm truncate after:absolute after:inset-0">{project.name}</Link>
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
      {project.repoUrl && <div className="mt-auto pt-3"><RepoLink url={project.repoUrl} /></div>}
    </div>
  );
}

type PublicBook = Awaited<ReturnType<typeof getPublicLibrary>>["books"][number];

function BookRow({ book }: { book: PublicBook }) {
  return (
    <Link href={`/books/${book.id}`} className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm">
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
