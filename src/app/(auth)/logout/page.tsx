"use client";

import { handleSignOut } from "@/app/actions/auth";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <LogOut className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sign out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out of your account?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You will need to sign back in to manage your knowledge base and view your progress.
          </p>
          <form action={handleSignOut} className="pt-4">
            <Button type="submit" variant="destructive" className="w-full">
              Yes, sign me out
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
            Cancel and return to dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
