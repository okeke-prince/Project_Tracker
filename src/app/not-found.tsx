import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-card surface">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-display">Off the map.</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          This page or profile doesn&apos;t exist. The link may be mistyped, or the username may have changed.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back home
      </Link>
    </div>
  );
}
