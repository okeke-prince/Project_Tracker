import { db } from "@/db";
import { projects } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Folder, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/session";
import { statusLabel } from "@/lib/status";

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const allProjects = await db.select().from(projects).where(eq(projects.userId, userId));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default: return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">Applying concepts into practice.</p>
        </div>
      </div>

      {allProjects.length === 0 && (
        <EmptyState
          art="projects"
          title="No projects yet"
          description="Add what you've built or are building, and link the concepts you used."
          action={
            <Link href="/manage?tab=projects" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" /> Add a project
            </Link>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {allProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors flex flex-col cursor-pointer">
              <CardHeader className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={`${getStatusColor(project.status)}`}>
                    {statusLabel(project.status)}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {project.techStack && JSON.parse(project.techStack).map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-xs bg-muted/50">{tech}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {project.tags && JSON.parse(project.tags).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
