"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Book, Compass, CornerDownLeft, Folder, Loader2, Milestone, Search, UserRound, type LucideIcon } from "lucide-react";
import { search, type SearchResult } from "@/app/actions/search";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GROUPS: { type: SearchResult["type"]; label: string; icon: LucideIcon }[] = [
  { type: "book", label: "Books", icon: Book },
  { type: "concept", label: "Concepts", icon: Compass },
  { type: "project", label: "Projects", icon: Folder },
  { type: "milestone", label: "Milestones", icon: Milestone },
  { type: "person", label: "People", icon: UserRound },
];

/** The navbar's search button and the search window it opens. ⌘K / Ctrl+K and "/" open it too. */
export function SearchCommand({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; items: SearchResult[] }>({ query: "", items: [] });
  const [active, setActive] = useState(0);
  const latest = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const ready = trimmed.length >= 2;
  const loading = ready && results.query !== trimmed;
  const items = ready && !loading ? results.items : [];

  // Keyboard shortcuts to open the window from anywhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search a moment after typing stops. Older responses are ignored if a newer one was sent.
  useEffect(() => {
    if (!ready) return;
    const id = ++latest.current;
    const timer = setTimeout(async () => {
      const found = await search(trimmed).catch(() => []);
      if (id === latest.current) {
        setResults({ query: trimmed, items: found });
        setActive(0);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [trimmed, ready]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const go = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.href);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    }
  };

  const scope = signedIn ? "your books, concepts, projects, milestones and people" : "people by name or username";

  return (
    <>
      {/* Wide bar on laptops, an icon on smaller screens. */}
      <Button
        variant="outline"
        className="hidden justify-start text-sm text-muted-foreground lg:flex lg:w-56 xl:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Search">
        <Search className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder={`Search ${scope}…`}
              className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search"
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {!ready && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least two letters to search {scope}.
              </p>
            )}

            {ready && !loading && items.length === 0 && (
              <EmptyState
                compact
                art="search"
                title="No results"
                description={<>Nothing matches &ldquo;{trimmed}&rdquo;. Check the spelling or try a shorter word.</>}
              />
            )}

            {GROUPS.map((group) => {
              const groupItems = items.filter((r) => r.type === group.type);
              if (groupItems.length === 0) return null;
              return (
                <div key={group.type} className="py-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{group.label}</p>
                  {groupItems.map((result) => {
                    const index = items.indexOf(result);
                    const selected = index === active;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        data-index={index}
                        onClick={() => go(result)}
                        onMouseMove={() => setActive(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                          selected ? "bg-muted text-foreground" : "text-foreground/80",
                        )}
                      >
                        {result.type === "person" ? (
                          <Avatar className="h-7 w-7 text-[10px]">
                            {result.image && <AvatarImage src={result.image} alt="" />}
                            <AvatarFallback>{result.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background">
                            <group.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{result.title}</span>
                          {result.subtitle && <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>}
                        </span>
                        {selected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="hidden items-center gap-4 border-t px-4 py-2 font-mono text-[10px] text-muted-foreground sm:flex">
            <span>↑↓ to move</span>
            <span>↵ to open</span>
            <span>esc to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
