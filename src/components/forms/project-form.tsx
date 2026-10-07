"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProject } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

type ProjectFormProps = {
  project?: any;
  concepts: any[];
  books: any[];
  onSuccess?: () => void;
};

export function ProjectForm({ project, concepts, books, onSuccess }: ProjectFormProps) {
  const [state, formAction] = useActionState(saveProject, null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const initialConceptIds = project?.conceptProjects?.map((cp: any) => cp.conceptId) || [];
  const initialBookIds = project?.bookProjects?.map((bp: any) => bp.bookId) || [];

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess?.();
      if (!project) formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess, project]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input id="name" name="name" defaultValue={project?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select name="status" defaultValue={project?.status || "idea"}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startedAt">Started on</Label>
          <Input id="startedAt" name="startedAt" type="date" defaultValue={project?.createdAt?.slice(0, 10)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="completedAt">Completed on</Label>
          <Input id="completedAt" name="completedAt" type="date" defaultValue={project?.completedAt ?? ""} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        These dates place the project on your timeline. GitHub projects default to the repo&apos;s creation date, and the completion date defaults to the day you mark it completed.
      </p>

      <div className="space-y-2">
        <Label htmlFor="repoUrl">Repository URL</Label>
        <Input id="repoUrl" name="repoUrl" type="url" defaultValue={project?.repoUrl} placeholder="https://github.com/..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="techStack">Tech Stack (comma separated)</Label>
        <Input id="techStack" name="techStack" defaultValue={project?.techStack ? JSON.parse(project.techStack).join(', ') : ''} placeholder="Next.js, Tailwind, Drizzle" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" defaultValue={project?.tags ? JSON.parse(project.tags).join(', ') : ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={project?.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lessonsLearned">Lessons Learned (Markdown)</Label>
        <Textarea id="lessonsLearned" name="lessonsLearned" rows={4} defaultValue={project?.lessonsLearned} />
      </div>

      <div className="space-y-2">
        <Label>Linked Concepts</Label>
        <div className="border rounded-md p-2">
          <ScrollArea className="h-[120px]">
            <div className="space-y-2 p-2">
              {concepts.map((concept) => (
                <div key={concept.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`concept-${concept.id}`} 
                    name="conceptIds" 
                    value={concept.id} 
                    defaultChecked={initialConceptIds.includes(concept.id)}
                  />
                  <label htmlFor={`concept-${concept.id}`} className="text-sm font-medium leading-none cursor-pointer">
                    {concept.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Linked Books</Label>
        <div className="border rounded-md p-2">
          <ScrollArea className="h-[120px]">
            <div className="space-y-2 p-2">
              {books.map((book) => (
                <div key={book.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`book-${book.id}`} 
                    name="bookIds" 
                    value={book.id} 
                    defaultChecked={initialBookIds.includes(book.id)}
                  />
                  <label htmlFor={`book-${book.id}`} className="text-sm font-medium leading-none cursor-pointer">
                    {book.title}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>{project ? 'Update Project' : 'Add Project'}</SubmitButton>
      </div>
    </form>
  );
}
