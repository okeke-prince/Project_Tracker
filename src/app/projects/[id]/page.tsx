import { db } from "@/db";
import { projects, conceptProjects, bookProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Compass, Book, ArrowLeft } from "lucide-react";
import { RepoLink } from "@/components/repo-link";
import { getCurrentUserId } from "@/lib/session";
import { getOwner } from "@/db/queries";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!project) {
    notFound();
  }

  const isOwner = (await getCurrentUserId()) === project.userId;
  const owner = await getOwner(project.userId);

  // Fetch related concepts
  const relatedConceptsLinks = await db.select().from(conceptProjects).where(eq(conceptProjects.projectId, project.id));
  const relatedConcepts = await Promise.all(relatedConceptsLinks.map(async (link) => {
    return await db.query.concepts.findFirst({ where: (concepts, { eq }) => eq(concepts.id, link.conceptId) });
  }));

  // Fetch related books
  const relatedBooksLinks = await db.select().from(bookProjects).where(eq(bookProjects.projectId, project.id));
  const relatedBooks = await Promise.all(relatedBooksLinks.map(async (link) => {
    return await db.query.books.findFirst({ where: (books, { eq }) => eq(books.id, link.bookId) });
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href={isOwner ? "/projects" : `/${owner?.username}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isOwner ? "Back to Projects" : `Back to ${owner?.name || owner?.username}'s profile`}
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={`capitalize text-sm px-3 py-1 ${getStatusColor(project.status)}`}>
            {project.status.replace('-', ' ')}
          </Badge>
          <div className="flex gap-2">
            {project.tags && JSON.parse(project.tags).map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-xl text-muted-foreground">{project.description}</p>
        {project.repoUrl && <RepoLink url={project.repoUrl} variant="button" />}
      </div>
      
      {project.techStack && (
        <div className="flex flex-wrap gap-2">
          {JSON.parse(project.techStack).map((tech: string) => (
            <Badge key={tech} variant="outline" className="bg-muted/50 text-sm py-1 px-3">{tech}</Badge>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Lessons Learned</h3>
        <div className="prose dark:prose-invert max-w-none">
          {project.lessonsLearned ? (
            <div>{project.lessonsLearned}</div>
          ) : (
            <p className="text-muted-foreground italic">No lessons documented yet.</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Applied Concepts
          </h3>
          {relatedConcepts.length > 0 ? (
            <ul className="space-y-3">
              {relatedConcepts.map(concept => concept && (
                <li key={concept.id}>
                  <Link href={`/concepts/${concept.id}`} className="block p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="font-medium">{concept.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{concept.status}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No concepts linked.</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Related Books
          </h3>
          {relatedBooks.length > 0 ? (
            <ul className="space-y-3">
              {relatedBooks.map(book => book && (
                <li key={book.id}>
                  <Link href={`/books/${book.id}`} className="block p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="font-medium">{book.title}</div>
                    <div className="text-sm text-muted-foreground">{book.authors}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No books linked.</p>
          )}
        </div>
      </div>
    </div>
  );
}
