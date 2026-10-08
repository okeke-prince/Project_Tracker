import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/logo";

/** The centred card used by the sign-in, sign-up and account recovery pages. */
export function AuthCard({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <LogoMark className="h-11 w-11" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        {footer && <CardFooter className="flex justify-center border-t p-6 text-sm text-muted-foreground">{footer}</CardFooter>}
      </Card>
    </div>
  );
}

/** A short success or error note inside an auth card. */
export function AuthNotice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  const styles = tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
    : "border-destructive/30 bg-destructive/5 text-destructive";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border p-3 text-center text-sm ${styles}`}>{children}</p>;
}
