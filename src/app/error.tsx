"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-card surface">
        <TriangleAlert className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl tracking-tight text-accent-serif">Something went wrong.</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          This page hit an unexpected error. Trying again usually fixes it.
        </p>
        {error.digest && <p className="font-mono text-xs text-muted-foreground">Error reference: {error.digest}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>Back home</Link>
      </div>
    </div>
  );
}
