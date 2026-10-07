"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/forms/project-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/mutations";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export function ProjectsSection({ projects, concepts, books }: { projects: any[], concepts: any[], books: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    const res = await deleteProject(id);
    if (res.success) {
      toast.success("Project deleted successfully");
    } else {
      toast.error(res.error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'in-progress': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </SheetTrigger>
          <SheetContent className="sm:max-w-[640px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Add New Project</SheetTitle>
            </SheetHeader>
            <ProjectForm concepts={concepts} books={books} onSuccess={() => setIsAddOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          art="projects"
          title="No projects yet"
          description="Add what you've built or are building, and link the concepts you used."
          action={<Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add a project</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate">{project.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className={`capitalize ${getStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{project.conceptProjects?.length || 0} Concepts</Badge>
                    {project.techStack && JSON.parse(project.techStack).map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-xs bg-muted/50">{tech}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Sheet open={editingProject?.id === project.id} onOpenChange={(open) => setEditingProject(open ? project : null)}>
                    <SheetTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Edit2 className="mr-2 h-3 w-3" /> Edit
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[640px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Edit Project</SheetTitle>
                      </SheetHeader>
                      <ProjectForm project={project} concepts={concepts} books={books} onSuccess={() => setEditingProject(null)} />
                    </SheetContent>
                  </Sheet>
                  
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                    if (window.confirm("Are you sure you want to delete this project?")) {
                      handleDelete(project.id);
                    }
                  }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
