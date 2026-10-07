import { db } from "@/db";
import { concepts, bookConcepts, conceptProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Book, Folder, ArrowLeft } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { getOwner } from "@/db/queries";

export default async function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concept = await db.query.concepts.findFirst({
    where: eq(concepts.id, id),
  });

  if (!concept) {
    notFound();
  }

  const isOwner = (await getCurrentUserId()) === concept.userId;
  const owner = await getOwner(concept.userId);

  // Fetch related books
  const relatedBooksLinks = await db.select().from(bookConcepts).where(eq(bookConcepts.conceptId, concept.id));
  const relatedBooks = await Promise.all(relatedBooksLinks.map(async (link) => {
    return await db.query.books.findFirst({ where: (books, { eq }) => eq(books.id, link.bookId) });
  }));

  // Fetch related projects
  const relatedProjectsLinks = await db.select().from(conceptProjects).where(eq(conceptProjects.conceptId, concept.id));
  const relatedProjects = await Promise.all(relatedProjectsLinks.map(async (link) => {
    return await db.query.projects.findFirst({ where: (projects, { eq }) => eq(projects.id, link.projectId) });
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'mastered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'applied': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'studied': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href={isOwner ? "/concepts" : `/${owner?.username}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isOwner ? "Back to Concepts" : `Back to ${owner?.name || owner?.username}'s profile`}
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Badge variant="outline" className={`capitalize text-sm px-3 py-1 ${getStatusColor(concept.status)}`}>
            {concept.status}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {concept.tags && JSON.parse(concept.tags).map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{concept.name}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">{concept.shortDescription}</p>
      </div>

      {/* Notes are private to the owner. */}
      {isOwner && (
        <div className="prose dark:prose-invert max-w-none">
          {concept.notes ? (
            <div>{concept.notes}</div>
          ) : (
            <p className="text-muted-foreground italic">No notes added yet.</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Sources & References
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
            <p className="text-sm text-muted-foreground">No related books.</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Applied In Projects
          </h3>
          {relatedProjects.length > 0 ? (
            <ul className="space-y-3">
              {relatedProjects.map(project => project && (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="block p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{project.status.replace('-', ' ')}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No related projects.</p>
          )}
        </div>
      </div>
    </div>
  );
}
