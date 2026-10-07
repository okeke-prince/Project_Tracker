"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, Compass, Folder, Home, Menu, Search, Moon, Sun, Settings, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const items = session?.user
    ? [...navItems, ...(username ? [{ href: `/${username}`, label: "Profile", icon: UserRound }] : [])]
    : [];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 dark:border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 lg:mr-4">
          <Compass className="h-6 w-6 text-primary transition-transform duration-500 hover:rotate-90" />
          <span className="hidden font-bold sm:inline">Knowledge Tracker</span>
        </Link>

        {/* Tablet and up: inline links. Labels appear once there is room. */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:text-foreground",
                isActive(item.href) ? "text-foreground" : "text-foreground/60"
              )}
            >
              {/* The pill slides between links as you navigate. */}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-muted"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {session?.user && (
            <Button variant="outline" className="hidden justify-start text-sm text-muted-foreground lg:flex lg:w-56 xl:w-64" onClick={() => alert('Search not implemented yet')}>
              <Search className="mr-2 h-4 w-4" />
              Search...
            </Button>
          )}
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

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </Button>
          )}
        </div>
      </div>

      {/* Phones: a panel that drops down under the bar. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border/60 md:hidden"
          >
            <motion.ul
              className="container mx-auto grid gap-1 px-4 py-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {items.map((item) => (
                <motion.li key={item.href} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(item.href) ? "bg-muted text-foreground" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
