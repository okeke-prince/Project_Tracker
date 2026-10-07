import { db } from "@/db";
import { books, concepts, projects, bookConcepts, bookProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Compass, Folder, ArrowLeft, Star, FileText } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { getOwner } from "@/db/queries";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewerId = await getCurrentUserId();
  const { id } = await params;
  const result = await db.select().from(books).where(eq(books.id, id));
  const book = result[0];

  if (!book) {
    notFound();
  }

  const isOwner = viewerId === book.userId;
  const owner = await getOwner(book.userId);

  // Fetch related concepts
  const conceptLinks = await db.select().from(bookConcepts).where(eq(bookConcepts.bookId, book.id));
  const relatedConcepts = await Promise.all(
    conceptLinks.map(async (link) => {
      const r = await db.select().from(concepts).where(eq(concepts.id, link.conceptId));
      return r[0] || null;
    })
  );

  // Fetch related projects
  const projectLinks = await db.select().from(bookProjects).where(eq(bookProjects.bookId, book.id));
  const relatedProjects = await Promise.all(
    projectLinks.map(async (link) => {
      const r = await db.select().from(projects).where(eq(projects.id, link.projectId));
      return r[0] || null;
    })
  );

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
      <Link href={isOwner ? "/books" : `/${owner?.username}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isOwner ? "Back to Books" : `Back to ${owner?.name || owner?.username}'s profile`}
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
        {!isOwner && owner?.username && (
          <p className="text-sm text-muted-foreground">
            On <Link href={`/${owner.username}`} className="text-primary hover:underline">{owner.name || owner.username}</Link>&apos;s shelf
            {book.finishedAt && <> · finished {book.finishedAt}</>}
          </p>
        )}
        
        {/* Reading and downloading are for the owner only. */}
        {isOwner && book.fileUrl && (
          <div className="pt-2">
            {book.fileUrl.includes('.epub') ? (
              <Link 
                href={`/read/${book.id}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                <FileText className="mr-2 h-4 w-4" />
                Read Book
              </Link>
            ) : (
              <Link 
                href={`/read/${book.id}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download / Read PDF
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Notes are private to the owner. */}
      {isOwner && (
        <div className="prose dark:prose-invert max-w-none">
          {book.notes ? (
            <div>{book.notes}</div>
          ) : (
            <p className="text-muted-foreground italic">No notes added yet.</p>
          )}
        </div>
      )}

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
