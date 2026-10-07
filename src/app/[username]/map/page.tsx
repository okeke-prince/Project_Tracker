import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getKnowledgeGraph, getUserByUsername } from "@/db/queries";
import { getCurrentUserId } from "@/lib/session";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { buttonVariants } from "@/components/ui/button";

type Props = { params: Promise<{ username: string }> };

const cleanUsername = (raw: string) => decodeURIComponent(raw).replace(/^@/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUserByUsername(cleanUsername((await params).username));
  if (!user) return { title: "Profile not found" };
  const name = user.name || user.username;
  return {
    title: `${name} · Knowledge map`,
    description: `How ${name}'s concepts connect to the books and projects behind them.`,
  };
}

export default async function ProfileMapPage({ params }: Props) {
  const user = await getUserByUsername(cleanUsername((await params).username));
  if (!user) notFound();

  const [viewerId, graph] = await Promise.all([getCurrentUserId(), getKnowledgeGraph(user.id)]);
  const isOwner = viewerId === user.id;
  const name = user.name || user.username!;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={`/${user.username}`} className="group inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {name}
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Knowledge map</h1>
          <p className="mt-2 text-muted-foreground">
            How {name}&apos;s concepts connect to the books that taught them and the projects that used them.
          </p>
        </div>
      </div>

      <div className="surface relative h-[65vh] min-h-[400px] overflow-hidden rounded-2xl border bg-card dark:bg-card/40 sm:h-[75vh] sm:min-h-[520px]">
        {graph.nodes.length > 0 ? (
          <KnowledgeGraph nodes={graph.nodes} links={graph.links} />
        ) : (
          <EmptyState
            art="concepts"
            title="No concepts yet"
            description={isOwner ? "Add concepts and link them to books and projects to build your map." : `${name} hasn't mapped any concepts yet.`}
            action={isOwner && <Link href="/manage?tab=concepts" className={buttonVariants()}>Add a concept</Link>}
            className="h-full justify-center"
          />
        )}
      </div>
    </div>
  );
}
