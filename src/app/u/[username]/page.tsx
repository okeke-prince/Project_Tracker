import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUserByUsername, getTimeline, getPublicLibrary } from "@/db/queries";
import { getCurrentUserId } from "@/lib/session";
import { Timeline } from "@/components/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Book as BookIcon, Compass, Folder, Pencil, Star } from "lucide-react";

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
  const name = user.name || user.username!;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = [
    { label: "Books read", value: library.books.filter((b) => b.status === "finished").length },
    { label: "Concepts", value: library.concepts.length },
    { label: "Projects", value: library.projects.length },
    { label: "Milestones", value: timeline.filter((e) => e.kind === "milestone").length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
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

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-8">
          <Timeline
            events={timeline}
            emptyMessage={isOwner ? "Add a milestone or finish a book in Manage to start your timeline." : `${name} hasn't added anything yet.`}
          />
        </TabsContent>

        <TabsContent value="books" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {library.books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <BookIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className={`capitalize ${statusColor[book.status] ?? defaultColor}`}>
                        {book.status.replace(/-/g, " ")}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                    <CardDescription>{book.authors}</CardDescription>
                    {book.rating && (
                      <div className="flex items-center text-yellow-500 pt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < book.rating! ? "fill-current" : "text-muted"}`} />
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {library.books.length === 0 && <p className="text-muted-foreground">No books yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="concepts" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {library.concepts.map((concept) => (
              <Link key={concept.id} href={`/concepts/${concept.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Compass className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className={`capitalize ${statusColor[concept.status] ?? defaultColor}`}>
                        {concept.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{concept.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{concept.shortDescription}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {library.concepts.length === 0 && <p className="text-muted-foreground">No concepts yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {library.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className={`capitalize ${statusColor[project.status] ?? defaultColor}`}>
                        {project.status.replace(/-/g, " ")}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  {project.techStack && (
                    <CardContent className="flex gap-2 flex-wrap">
                      {JSON.parse(project.techStack).map((tech: string) => (
                        <Badge key={tech} variant="outline" className="text-xs bg-muted/50">{tech}</Badge>
                      ))}
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
            {library.projects.length === 0 && <p className="text-muted-foreground">No projects yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
