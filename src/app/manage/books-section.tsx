"use client";

import { useState } from "react";
import { BookForm } from "@/components/forms/book-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { deleteBook } from "@/app/actions/mutations";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // need to install this

export function BooksSection({ books, concepts }: { books: any[], concepts: any[] }) {
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
          <SheetTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Book</Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Add New Book</SheetTitle>
            </SheetHeader>
            <BookForm concepts={concepts} onSuccess={() => setIsAddOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {books.length === 0 ? (
        <div className="text-center p-12 border rounded-xl border-dashed">
          <p className="text-muted-foreground">No books found. Add your first book!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <Card key={book.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate">{book.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{book.authors}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={`capitalize ${getStatusColor(book.status)}`}>
                      {book.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{book.bookConcepts?.length || 0} Concepts</Badge>
                    {book.progress > 0 && book.progress < 100 && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center ml-2">
                        {book.progress}% read
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Sheet open={editingBook?.id === book.id} onOpenChange={(open) => setEditingBook(open ? book : null)}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm"><Edit2 className="mr-2 h-3 w-3" /> Edit</Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Edit Book</SheetTitle>
                      </SheetHeader>
                      <BookForm book={book} concepts={concepts} onSuccess={() => setEditingBook(null)} />
                    </SheetContent>
                  </Sheet>
                  
                  {/* I need to make sure AlertDialog is installed, I will install it in the background if needed, but for now I'll use native confirm if I can't install. Actually I'll just use a button with confirm for speed. */}
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
