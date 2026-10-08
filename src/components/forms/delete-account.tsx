"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { deleteAccount } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccount({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirmation.trim().toLowerCase() === username.toLowerCase();

  const onDelete = () =>
    startTransition(async () => {
      const result = await deleteAccount(confirmation);
      if (result && !result.success) toast.error(result.error);
    });

  return (
    <div className="rounded-xl border border-destructive/30 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="space-y-1">
          <h3 className="font-semibold">Delete account</h3>
          <p className="text-sm text-muted-foreground">
            Permanently removes your profile, timeline, books and their files, concepts, projects and milestones. This can&apos;t be undone.
          </p>
        </div>
      </div>

      {!open ? (
        <Button variant="destructive" onClick={() => setOpen(true)}>Delete my account</Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono">{username}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" disabled={!matches || pending} onClick={onDelete}>
              {pending ? "Deleting…" : "Permanently delete"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => { setOpen(false); setConfirmation(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
