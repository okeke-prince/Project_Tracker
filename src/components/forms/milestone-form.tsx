"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveMilestone } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";

type MilestoneFormProps = {
  milestone?: any;
  onSuccess?: () => void;
};

export function MilestoneForm({ milestone, onSuccess }: MilestoneFormProps) {
  const [state, formAction] = useActionState(saveMilestone, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess?.();
      if (!milestone) formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess, milestone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {milestone && <input type="hidden" name="id" value={milestone.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" defaultValue={milestone?.title} placeholder="Graduated with a BSc in Computer Science" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={milestone?.type || "education"}>
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="award">Award</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" defaultValue={milestone?.date} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link</Label>
        <Input id="link" name="link" type="url" defaultValue={milestone?.link ?? ""} placeholder="https://www.credly.com/badges/..." />
        <p className="text-xs text-muted-foreground">A certificate, badge or announcement people can open.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={milestone?.description ?? ""} />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>{milestone ? 'Save changes' : 'Add milestone'}</SubmitButton>
      </div>
    </form>
  );
}
