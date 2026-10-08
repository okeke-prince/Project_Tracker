import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUserByUsername, getTimeline, getPublicLibrary, getKnowledgeGraph } from "@/db/queries";
import { getCurrentUserId } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { Timeline } from "@/components/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RepoLink } from "@/components/repo-link";
import { LazyKnowledgeGraph } from "@/components/knowledge-graph";
import { buttonVariants } from "@/components/ui/button";
import { Download, Flag, Pencil, Star } from "lucide-react";
import type { ReactNode } from "react";
import { plural, statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

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

// Things that are done read in full ink with a blue dot; everything else is muted.
const DONE_STATUSES = new Set(["finished", "mastered", "completed"]);

function Status({ status }: { status: string }) {
  const done = DONE_STATUSES.has(status);
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs", done ? "text-foreground" : "text-muted-foreground")}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", done ? "bg-mark" : "border border-current")} />
      {statusLabel(status)}
    </span>
  );
}

/** "6 books read, 18 concepts, 8 projects and 5 milestones so far." Empty counts are left out. */
function summarise(parts: string[]) {
  if (parts.length === 0) return null;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} so far.`;
}

export default async function ProfilePage({ params }: Props) {
  const username = cleanUsername((await params).username);
  const [user, viewerId] = await Promise.all([getUserByUsername(username, { includeSuspended: true }), getCurrentUserId()]);
  // Suspended profiles are hidden, except from admins who need to review them.
  if (!user || (user.suspendedAt && !(await isAdmin(viewerId)))) notFound();

  const [timeline, library, graph] = await Promise.all([
    getTimeline(user.id),
    getPublicLibrary(user.id),
    getKnowledgeGraph(user.id),
  ]);
  const isOwner = viewerId === user.id;
  const readingNow = library.books.filter((b) => b.status === "reading");
  const otherBooks = library.books.filter((b) => b.status !== "reading");
  const name = user.name || user.username!;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const booksRead = library.books.filter((b) => b.status === "finished").length;
  const milestoneCount = timeline.filter((e) => e.kind === "milestone").length;
  const summary = summarise([
    booksRead > 0 ? `${plural(booksRead, "book")} read` : "",
    library.concepts.length > 0 ? plural(library.concepts.length, "concept") : "",
    library.projects.length > 0 ? plural(library.projects.length, "project") : "",
    milestoneCount > 0 ? plural(milestoneCount, "milestone") : "",
  ].filter(Boolean));

  return (
    <div className="max-w-6xl mx-auto space-y-14 sm:space-y-16">
      {user.suspendedAt && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          This account is suspended. Only admins can see this page. <Link href="/admin" className="underline underline-offset-4">Back to admin</Link>
        </p>
      )}

      <header className="pt-4 sm:pt-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 text-base sm:h-16 sm:w-16">
            <AvatarImage src={user.image || ""} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
        <h1 className="mt-5 font-display text-5xl break-words sm:text-7xl lg:text-8xl">{name}</h1>
        {user.headline && <p className="mt-4 max-w-2xl text-lg sm:text-xl">{user.headline}</p>}
        {summary && <p className="mt-2 text-muted-foreground">{summary}</p>}
        {user.bio && <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground whitespace-pre-line">{user.bio}</p>}

        {(user.cvUpdatedAt || isOwner) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {user.cvUpdatedAt && (
              // A plain <a>: it's a file download, not a page.
              <a href={`/api/cv/${user.username}?v=${user.cvUpdatedAt.getTime()}`} download className={buttonVariants()}>
                <Download className="mr-2 h-4 w-4" /> Download CV
              </a>
            )}
            {isOwner && (
              <Link href="/manage?tab=profile" className={buttonVariants({ variant: "outline" })}>
                <Pencil className="mr-2 h-4 w-4" /> Edit profile
              </Link>
            )}
          </div>
        )}
      </header>

      <Section title="Projects" count={library.projects.length}>
        <ShowMore
          layout="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3"
          preview={6}
          items={library.projects.map((project) => <ProjectItem key={project.id} project={project} />)}
          empty={isOwner ? "Add your first project in Manage so it shows up here." : "No projects yet."}
        />
      </Section>

      {graph.nodes.length > 0 && (
        <Section
          title="Knowledge map"
          action={
            <Link href={`/${user.username}/map`} className="text-sm font-medium underline-offset-4 hover:underline">
              Open the full map
            </Link>
          }
        >
          <p className="-mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">How {name}&apos;s concepts connect to the books that taught them and the projects that used them.</p>
          <Link href={`/${user.username}/map`} aria-label={`Open ${name}'s knowledge map`} className="block h-[300px] overflow-hidden border bg-card sm:h-[380px]">
            <LazyKnowledgeGraph nodes={graph.nodes} links={graph.links} compact />
          </Link>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <Section title="Timeline">
          <Timeline
            events={timeline}
            emptyMessage={isOwner ? "Add a milestone or finish a book in Manage to start your timeline." : `${name} hasn't added anything yet.`}
          />
        </Section>

        {/* One column that sticks beside the timeline, so books and concepts stay in reach as it scrolls. */}
        <aside className="space-y-14 lg:sticky lg:top-20 lg:self-start">
          <Section title="Books" count={library.books.length}>
            {readingNow.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-medium text-muted-foreground">Reading now</h3>
                <div className="mt-1">{readingNow.map((book) => <BookRow key={book.id} book={book} />)}</div>
              </div>
            )}
            <ShowMore
              items={otherBooks.map((book) => <BookRow key={book.id} book={book} />)}
              empty={readingNow.length === 0 ? "No books yet." : null}
              layout=""
            />
          </Section>

          <Section title="Concepts" count={library.concepts.length}>
            {library.concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No concepts yet.</p>
            ) : (
              <div className="space-y-5">
                {(["mastered", "applied", "studied"] as const).map((status) => {
                  const group = library.concepts.filter((c) => c.status === status);
                  if (group.length === 0) return null;
                  return (
                    <div key={status}>
                      <h3 className="text-sm font-medium text-muted-foreground">{statusLabel(status)} ({group.length})</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.map((concept) => (
                          <Link
                            key={concept.id}
                            href={`/concepts/${concept.id}`}
                            title={concept.shortDescription ?? undefined}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-sm transition-colors hover:border-foreground/40",
                              status === "mastered" ? "border-mark/40 bg-mark/10" : status === "studied" && "text-muted-foreground",
                            )}
                          >
                            {concept.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </aside>
      </div>

      {!isOwner && (
        <footer className="flex justify-end border-t pt-6">
          <Link href={`/report?user=${user.username}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Flag className="h-3 w-3" /> Report this profile
          </Link>
        </footer>
      )}
    </div>
  );
}

function Section({ title, count, action, className, children }: {
  title: string;
  count?: number;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 className="text-lg font-semibold">
          {title}
          {count !== undefined && count > 0 && <span className="ml-2 font-normal text-muted-foreground">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
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
    <div>
      <div className={layout}>{items.slice(0, preview)}</div>
      {items.length > preview && (
        <details className="group">
          <summary className="mt-3 cursor-pointer list-none text-sm font-medium underline-offset-4 hover:underline">
            <span className="group-open:hidden">Show all {items.length}</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <div className={cn("pt-1", layout)}>{items.slice(preview)}</div>
        </details>
      )}
    </div>
  );
}

type PublicProject = Awaited<ReturnType<typeof getPublicLibrary>>["projects"][number];

function ProjectItem({ project }: { project: PublicProject }) {
  const stack: string[] = project.techStack ? JSON.parse(project.techStack) : [];
  return (
    <article className="relative flex h-full flex-col border-b py-4">
      <div className="flex items-baseline justify-between gap-3">
        {/* Stretched link: the whole item opens the project, the repo link sits above it. */}
        <Link href={`/projects/${project.id}`} className="min-w-0 truncate font-semibold underline-offset-4 after:absolute after:inset-0 hover:underline">
          {project.name}
        </Link>
        <Status status={project.status} />
      </div>
      {project.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
      {stack.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{stack.slice(0, 4).join(", ")}</p>}
      {project.repoUrl && <div className="mt-auto pt-3"><RepoLink url={project.repoUrl} /></div>}
    </article>
  );
}

type PublicBook = Awaited<ReturnType<typeof getPublicLibrary>>["books"][number];

function BookRow({ book }: { book: PublicBook }) {
  return (
    <Link href={`/books/${book.id}`} className="group flex items-start justify-between gap-3 border-b py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug underline-offset-4 group-hover:underline">{book.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.authors}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        {book.status !== "reading" && <Status status={book.status} />}
        {book.rating && (
          <div className="flex text-foreground/70" aria-label={`Rated ${book.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} aria-hidden className={cn("h-3 w-3", i < book.rating! ? "fill-current" : "text-border")} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
