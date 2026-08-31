"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveBook } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

type BookFormProps = {
  book?: any;
  concepts: any[];
  onSuccess?: () => void;
};

export function BookForm({ book, concepts, onSuccess }: BookFormProps) {
  const [state, formAction] = useActionState(saveBook, null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Extract initial linked concepts if editing
  const initialConceptIds = book?.bookConcepts?.map((bc: any) => bc.conceptId) || [];

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess?.();
      if (!book) formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess, book]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {book && <input type="hidden" name="id" value={book.id} />}
      
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" defaultValue={book?.title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="authors">Authors *</Label>
        <Input id="authors" name="authors" defaultValue={book?.authors} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" defaultValue={book?.year} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input id="progress" name="progress" type="number" min="0" max="100" defaultValue={book?.progress || 0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select name="status" defaultValue={book?.status || "want-to-read"}>
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="want-to-read">Want to Read</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating (1-5)</Label>
          <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={book?.rating} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" defaultValue={book?.tags ? JSON.parse(book.tags).join(', ') : ''} placeholder="architecture, clean-code" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Markdown)</Label>
        <Textarea id="notes" name="notes" rows={5} defaultValue={book?.notes} className="font-mono text-sm" />
      </div>

      <div className="space-y-2">
        <Label>Linked Concepts</Label>
        <div className="border rounded-md p-2">
          <ScrollArea className="h-[150px]">
            <div className="space-y-2 p-2">
              {concepts.map((concept) => (
                <div key={concept.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`concept-${concept.id}`} 
                    name="conceptIds" 
                    value={concept.id} 
                    defaultChecked={initialConceptIds.includes(concept.id)}
                  />
                  <label htmlFor={`concept-${concept.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    {concept.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>{book ? 'Update Book' : 'Add Book'}</SubmitButton>
      </div>
    </form>
  );
}
