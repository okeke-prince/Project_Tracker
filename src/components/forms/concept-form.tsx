"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveConcept } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";

type ConceptFormProps = {
  concept?: any;
  onSuccess?: () => void;
};

export function ConceptForm({ concept, onSuccess }: ConceptFormProps) {
  const [state, formAction] = useActionState(saveConcept, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess?.();
      if (!concept) formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess, concept]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {concept && <input type="hidden" name="id" value={concept.id} />}
      
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={concept?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL friendly)</Label>
        <Input id="slug" name="slug" defaultValue={concept?.slug} placeholder="Leave blank to auto-generate from name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input id="shortDescription" name="shortDescription" defaultValue={concept?.shortDescription} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select name="status" defaultValue={concept?.status || "studied"}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studied">Studied</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="mastered">Mastered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" defaultValue={concept?.tags ? JSON.parse(concept.tags).join(', ') : ''} placeholder="architecture, clean-code" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Private notes (Markdown)</Label>
        <Textarea id="notes" name="notes" rows={5} defaultValue={concept?.notes} className="font-mono text-sm" />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>{concept ? 'Update Concept' : 'Add Concept'}</SubmitButton>
      </div>
    </form>
  );
}
