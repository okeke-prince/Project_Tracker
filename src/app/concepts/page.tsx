import { db } from "@/db";
import { concepts } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/session";
import { getKnowledgeGraph } from "@/db/queries";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { buttonVariants } from "@/components/ui/button";

export default async function ConceptsPage() {
  const userId = await requireUserId();
  const allConcepts = await db.select().from(concepts).where(eq(concepts.userId, userId));
  const graph = await getKnowledgeGraph(userId);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'mastered': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'applied': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'studied': return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Concepts map</h1>
          <p className="text-muted-foreground mt-2">Architecture concepts and patterns you are learning, and how they connect to your books and projects.</p>
        </div>
      </div>

      {allConcepts.length === 0 ? (
        <EmptyState
          art="concepts"
          title="No concepts yet"
          description="Add the patterns and ideas you're learning, then link them to the books that taught you and the projects where you used them."
          action={
            <Link href="/manage?tab=concepts" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" /> Add a concept
            </Link>
          }
        />
      ) : (
        <div className="surface relative h-[60vh] min-h-[380px] sm:h-[70vh] sm:min-h-[480px] overflow-hidden rounded-2xl border bg-card dark:bg-card/40">
          <KnowledgeGraph nodes={graph.nodes} links={graph.links} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {allConcepts.map((concept) => (
          <Link key={concept.id} href={`/concepts/${concept.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors flex flex-col cursor-pointer relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(concept.status).split(' ')[0].replace('/10', '')}`} />
              <CardHeader className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={`capitalize ${getStatusColor(concept.status)}`}>
                    {concept.status}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{concept.name}</CardTitle>
                <CardDescription className="line-clamp-3 mt-2">{concept.shortDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {concept.tags && JSON.parse(concept.tags).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
