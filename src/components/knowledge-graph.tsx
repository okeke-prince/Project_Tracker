"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GraphLink, GraphNode } from "@/db/queries";

const Loading = () => (
  <div className="flex h-full items-center justify-center">
    <span className="text-sm text-muted-foreground animate-pulse">Building the map…</span>
  </div>
);

// three.js touches `window`, so the scene only ever renders in the browser.
const KnowledgeGraph3D = dynamic(() => import("./knowledge-graph-3d"), { ssr: false, loading: Loading });

type Props = { nodes: GraphNode[]; links: GraphLink[]; compact?: boolean };

export function KnowledgeGraph({ nodes, links, compact }: Props) {
  return <KnowledgeGraph3D nodes={nodes} links={links} compact={compact} />;
}

// Waits until the map is about to scroll into view before loading three.js, so the
// profile stays quick on phones for visitors who never scroll that far.
export function LazyKnowledgeGraph(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {visible ? <KnowledgeGraph {...props} /> : <Loading />}
    </div>
  );
}
