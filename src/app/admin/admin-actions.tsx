"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteUserAsAdmin, restoreUser, setReportStatus, suspendUser } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";

type Result = { success: boolean; error?: string };

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<Result>, done: string) =>
    startTransition(async () => {
      const result = await action().catch((err: Error) => ({ success: false, error: err.message }));
      if (result.success) toast.success(done);
      else toast.error(result.error ?? "That didn't work.");
    });
  return { pending, run };
}

export function ReportActions({ reportId, userId, username, suspended }: { reportId: string; userId: string; username: string; suspended: boolean }) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      {!suspended && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => suspendUser(userId), `@${username} is suspended.`)}>
          Suspend @{username}
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setReportStatus(reportId, "resolved"), "Marked as handled.")}>
        Mark handled
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setReportStatus(reportId, "dismissed"), "Report dismissed.")}>
        Dismiss
      </Button>
    </div>
  );
}

export function UserActions({ userId, username }: { userId: string; username: string }) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => restoreUser(userId), `@${username} is restored.`)}>
        Restore
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Permanently delete @${username} and everything they've added? This can't be undone.`)) return;
          run(() => deleteUserAsAdmin(userId), `@${username} was deleted.`);
        }}
      >
        Delete account
      </Button>
    </div>
  );
}
