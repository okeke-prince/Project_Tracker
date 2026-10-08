"use client";

import { useState } from "react";
import { ConceptForm } from "@/components/forms/concept-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { deleteConcept } from "@/app/actions/mutations";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { statusLabel } from "@/lib/status";

export function ConceptsSection({ concepts }: { concepts: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    const res = await deleteConcept(id);
    if (res.success) {
      toast.success("Concept deleted successfully");
    } else {
      toast.error(res.error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'mastered': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'applied': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Add concept
          </SheetTrigger>
          <SheetContent className="sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Add a concept</SheetTitle>
            </SheetHeader>
            <ConceptForm onSuccess={() => setIsAddOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {concepts.length === 0 ? (
        <EmptyState
          art="concepts"
          title="No concepts yet"
          description="Add the patterns and ideas you're learning, then link them to books and projects."
          action={<Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add a concept</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {concepts.map((concept) => (
            <Card key={concept.id} className="shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate">{concept.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{concept.shortDescription}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={`${getStatusColor(concept.status)}`}>
                      {statusLabel(concept.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Sheet open={editingConcept?.id === concept.id} onOpenChange={(open) => setEditingConcept(open ? concept : null)}>
                    <SheetTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Edit2 className="mr-2 h-3 w-3" /> Edit
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                      <SheetHeader className="mb-6">
                        <SheetTitle>Edit concept</SheetTitle>
                      </SheetHeader>
                      <ConceptForm concept={concept} onSuccess={() => setEditingConcept(null)} />
                    </SheetContent>
                  </Sheet>
                  
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                    if (window.confirm("Are you sure you want to delete this concept?")) {
                      handleDelete(concept.id);
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
