import { db } from "@/db";
import { books, bookConcepts, bookProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Compass, Folder, ArrowLeft, Star } from "lucide-react";

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const book = await db.query.books.findFirst({
    where: eq(books.id, params.id),
  });

  if (!book) {
    notFound();
  }

  // Fetch related concepts
  const relatedConceptsLinks = await db.select().from(bookConcepts).where(eq(bookConcepts.bookId, book.id));
  const relatedConcepts = await Promise.all(relatedConceptsLinks.map(async (link) => {
    return await db.query.concepts.findFirst({ where: (concepts, { eq }) => eq(concepts.id, link.conceptId) });
  }));

  // Fetch related projects (if any)
  const relatedProjectsLinks = await db.select().from(bookProjects).where(eq(bookProjects.bookId, book.id));
  const relatedProjects = await Promise.all(relatedProjectsLinks.map(async (link) => {
    return await db.query.projects.findFirst({ where: (projects, { eq }) => eq(projects.id, link.projectId) });
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'finished': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'reading': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'reference': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/books" className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Books
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={`capitalize text-sm px-3 py-1 ${getStatusColor(book.status)}`}>
            {book.status.replace('-', ' ')}
          </Badge>
          <div className="flex gap-2">
            {book.tags && JSON.parse(book.tags).map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          {book.rating && (
            <div className="flex items-center text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < book.rating! ? 'fill-current' : 'text-muted'}`} />
              ))}
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{book.title}</h1>
        <p className="text-xl text-muted-foreground">by {book.authors} {book.year ? `(${book.year})` : ''}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {book.notes ? (
          <div>{book.notes}</div>
        ) : (
          <p className="text-muted-foreground italic">No notes added yet.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Related Concepts
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
            <Folder className="h-5 w-5" />
            Related Projects
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
            <p className="text-sm text-muted-foreground">No projects linked.</p>
          )}
        </div>
      </div>
    </div>
  );
}
