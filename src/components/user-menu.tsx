"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { handleSignOut } from "@/app/actions/auth";
import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserMenu({ session, username, isAdmin = false }: { session: Session | null; username?: string | null; isAdmin?: boolean }) {
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sign in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          Sign up
        </Link>
      </div>
    );
  }

  const { user } = session;
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || ""} alt={user.name || "Avatar"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {username && (
          <DropdownMenuItem render={<Link href={`/${username}`} className="cursor-pointer" />}>
            <UserRound className="mr-2 h-4 w-4" />
            <span>Your public profile</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href="/manage" className="cursor-pointer" />}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" className="cursor-pointer" />}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Admin</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" render={<button form="logout-form" type="submit" className="w-full cursor-pointer" />}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        <form id="logout-form" action={handleSignOut} className="hidden" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
