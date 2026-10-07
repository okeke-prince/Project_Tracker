"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, Compass, Folder, Home, Search, Moon, Sun, Settings, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

import { UserMenu } from "./user-menu";
import type { Session } from "next-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/concepts", label: "Concepts", icon: Compass },
  { href: "/books", label: "Books", icon: Book },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/manage", label: "Manage", icon: Settings },
];

export function Navbar({ session, username }: { session: Session | null; username?: string | null }) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 dark:border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Compass className="h-6 w-6 text-primary transition-transform duration-500 hover:rotate-90" />
            <span className="font-bold sm:inline-block">Knowledge Tracker</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {session?.user && [
              ...navItems,
              ...(username ? [{ href: `/${username}`, label: "Profile", icon: UserRound }] : []),
            ].map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:text-foreground",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {/* The pill slides between links as you navigate. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-muted"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className={cn("w-full flex-1 md:w-auto md:flex-none", !session?.user && "invisible")}>
            <Button variant="outline" className="w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64" onClick={() => alert('Search not implemented yet')}>
              <Search className="mr-2 h-4 w-4" />
              Search...
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <UserMenu session={session} username={username} />
        </div>
      </div>
    </header>
  );
}
