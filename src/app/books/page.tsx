import { db } from "@/db";
import { books } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Book as BookIcon } from "lucide-react";

export default async function BooksPage() {
  const allBooks = await db.select().from(books);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'finished': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'reading': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'reference': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <p className="text-muted-foreground mt-2">Your reading list and references.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allBooks.map((book) => {
          const hasFile = !!book.fileUrl;
          const href = hasFile ? `/read/${book.id}` : `/books/${book.id}`;
          return (
          <Link key={book.id} href={href}>
            <Card className="h-full hover:border-primary/50 transition-colors flex flex-col cursor-pointer">
              <CardHeader className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <BookIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={`capitalize ${getStatusColor(book.status)}`}>
                    {book.status.replace('-', ' ')}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                <CardDescription>{book.authors}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap mt-2">
                  {book.tags && JSON.parse(book.tags).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
