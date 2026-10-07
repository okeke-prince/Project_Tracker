import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, BookOpen, Compass, GraduationCap, Rocket } from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Milestones", text: "Graduations, certifications, new roles. The moments that shaped you, on one timeline." },
  { icon: BookOpen, title: "Books", text: "Show what you've read and what you're reading now. Your files and notes stay private." },
  { icon: Compass, title: "Concepts", text: "The patterns and ideas you've studied, applied and mastered." },
  { icon: Rocket, title: "Projects", text: "What you've built, and which concepts you put into practice." },
];

export function Landing() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8 animate-in fade-in duration-700">
      <section className="text-center space-y-6">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <BadgeCheck className="mr-1.5 h-3 w-3 text-primary" /> Your learning journey, in one link
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Show people what you&apos;ve been up to.</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Build a public timeline of your milestones, the books you&apos;ve read, the concepts you&apos;ve learned
          and the projects where you applied them, so anyone can get to know you and see everything you&apos;ve covered.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>Create your timeline</Link>
          <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>Sign in</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="shadow-sm">
            <CardContent className="p-6 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
