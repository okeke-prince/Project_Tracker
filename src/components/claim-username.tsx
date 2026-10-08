"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { checkUsernameAvailability } from "@/app/actions/auth";
import { normalizeUsername } from "@/lib/username-format";

type Status = { available: boolean; error: string | null } | null;

export function ClaimUsername({ host }: { host: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [checking, startCheck] = useTransition();
  const username = normalizeUsername(value);

  // Check availability shortly after the person stops typing.
  useEffect(() => {
    if (!username) return;
    const timer = setTimeout(() => {
      startCheck(async () => {
        const result = await checkUsernameAvailability(username);
        setStatus({ available: result.available, error: result.error });
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [username]);

  const shown = username ? status : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (shown?.available) router.push(`/register?username=${encodeURIComponent(username)}`);
      }}
      className="w-full max-w-md space-y-2"
    >
      <div className="flex items-center rounded-lg border bg-card p-1.5 pl-3.5 transition-colors focus-within:border-foreground/50">
        <span className="text-muted-foreground whitespace-nowrap"><span className="hidden sm:inline">{host}</span>/</span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus(null);
          }}
          placeholder="yourname"
          aria-label="Choose a username"
          autoComplete="off"
          spellCheck={false}
          maxLength={30}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
        />
        <span className="mx-2 flex h-4 w-4 items-center justify-center">
          {username && checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {username && !checking && shown?.available && <Check className="h-4 w-4" />}
          {username && !checking && shown && !shown.available && <X className="h-4 w-4 text-muted-foreground" />}
        </span>
        <button
          type="submit"
          disabled={!shown?.available || checking}
          className="inline-flex shrink-0 items-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40 sm:px-4"
        >
          Get my page
        </button>
      </div>
      <AnimatePresence mode="wait">
        {shown && !checking && (
          <motion.p
            key={shown.available ? "ok" : shown.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground"
          >
            {shown.available ? `${username} is yours if you want it.` : shown.error}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
