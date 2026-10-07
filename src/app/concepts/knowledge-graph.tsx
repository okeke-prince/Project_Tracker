"use client";

import dynamic from "next/dynamic";
import type { GraphLink, GraphNode } from "@/db/queries";

// three.js touches `window`, so the scene only ever renders in the browser.
const KnowledgeGraph3D = dynamic(() => import("./knowledge-graph-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Building your map…</span>
    </div>
  ),
});

export function KnowledgeGraph({ nodes, links }: { nodes: GraphNode[]; links: GraphLink[] }) {
  return <KnowledgeGraph3D nodes={nodes} links={links} />;
}
