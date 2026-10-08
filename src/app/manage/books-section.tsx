"use client";

import { useState } from "react";
import { BookForm } from "@/components/forms/book-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { deleteBook } from "@/app/actions/mutations";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { statusLabel, plural } from "@/lib/status";

export function BooksSection({ books, concepts, projects }: { books: any[], concepts: any[], projects: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    const res = await deleteBook(id);
    if (res.success) {
      toast.success("Book deleted successfully");
    } else {
      toast.error(res.error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'finished': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'reading': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'reference': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Add book
          </SheetTrigger>
          <SheetContent className="sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Add a book</SheetTitle>
            </SheetHeader>
            <BookForm concepts={concepts} projects={projects} onSuccess={() => setIsAddOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {books.length === 0 ? (
        <EmptyState
          art="books"
          title="No books yet"
          description="Add the books you're reading or have finished. Your files and notes stay private."
          action={<Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add a book</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <Card key={book.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate">{book.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{book.authors}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={`${getStatusColor(book.status)}`}>
                      {statusLabel(book.status)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{plural(book.bookConcepts?.length || 0, "concept")}</Badge>
                    {book.progress > 0 && book.progress < 100 && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center ml-2">
                        {book.progress}% read
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Sheet open={editingBook?.id === book.id} onOpenChange={(open) => setEditingBook(open ? book : null)}>
                    <SheetTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Edit2 className="mr-2 h-3 w-3" /> Edit
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Edit book</SheetTitle>
                      </SheetHeader>
                      <BookForm book={book} concepts={concepts} projects={projects} onSuccess={() => setEditingBook(null)} />
                    </SheetContent>
                  </Sheet>
                  
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                    if (window.confirm("Are you sure you want to delete this book?")) {
                      handleDelete(book.id);
                    }
                  }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
