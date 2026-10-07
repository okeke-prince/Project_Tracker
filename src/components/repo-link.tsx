import { ArrowUpRight, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";

// lucide no longer ships brand icons, so the GitHub mark is inlined.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** "owner/repo" for GitHub-style URLs, otherwise the host and path. */
export function repoLabel(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\.git$/, "").replace(/^\/|\/$/g, "");
    return u.hostname === "github.com" ? path : `${u.hostname}/${path}`;
  } catch {
    return url;
  }
}

export function RepoLink({ url, variant = "inline", className }: { url: string; variant?: "inline" | "button"; className?: string }) {
  const isGitHub = url.includes("github.com");
  const Icon = isGitHub ? GitHubMark : GitFork;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group/repo relative z-10 inline-flex max-w-full items-center gap-1.5 font-mono transition-colors",
        variant === "button"
          ? "rounded-full border bg-card px-3.5 py-1.5 text-sm hover:border-foreground/40 surface dark:bg-card/50"
          : "text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Icon className={variant === "button" ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      <span className="truncate">{repoLabel(url)}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/repo:-translate-y-0.5 group-hover/repo:translate-x-0.5" />
    </a>
  );
}
