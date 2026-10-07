"use client";

import { useState } from "react";
import { MilestoneForm } from "@/components/forms/milestone-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { deleteMilestone } from "@/app/actions/mutations";
import { formatEventDate } from "@/lib/dates";
import { toast } from "sonner";

export function MilestonesSection({ milestones }: { milestones: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    const res = await deleteMilestone(id);
    if (res.success) {
      toast.success("Milestone deleted");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">Graduations, certifications, new jobs and other moments for your timeline.</p>
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Milestone
          </SheetTrigger>
          <SheetContent className="sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Add New Milestone</SheetTitle>
            </SheetHeader>
            <MilestoneForm onSuccess={() => setIsAddOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center p-12 border rounded-xl border-dashed">
          <p className="text-muted-foreground">No milestones yet. Add when you graduated or got certified!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate">{milestone.title}</h4>
                  <p className="text-sm text-muted-foreground">{formatEventDate(milestone.date)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{milestone.type}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Sheet open={editingMilestone?.id === milestone.id} onOpenChange={(open) => setEditingMilestone(open ? milestone : null)}>
                    <SheetTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Edit2 className="mr-2 h-3 w-3" /> Edit
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Edit Milestone</SheetTitle>
                      </SheetHeader>
                      <MilestoneForm milestone={milestone} onSuccess={() => setEditingMilestone(null)} />
                    </SheetContent>
                  </Sheet>

                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                    if (window.confirm("Are you sure you want to delete this milestone?")) {
                      handleDelete(milestone.id);
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
