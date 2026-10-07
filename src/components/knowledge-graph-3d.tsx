"use client";

// The 3D scene itself. Imported only on the client (see knowledge-graph.tsx) because
// three.js needs the browser's WebGL. In compact mode (the profile preview) it only
// spins: a cover sits over the canvas so dragging scrolls the page on phones instead
// of orbiting, and taps fall through to the link around the preview.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import ForceGraph3D from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import { ArrowRight, X } from "lucide-react";
import type { GraphLink, GraphNode } from "@/db/queries";

type Node = GraphNode & { x?: number; y?: number; z?: number; degree: number };
type Link3D = { source: string | Node; target: string | Node };

const PALETTE = {
  dark: { concept: "#f3ede2", book: "#f5c451", project: "#4ade80", link: "rgba(243,237,226,0.14)", dim: "#3a3631", text: "#f3ede2" },
  light: { concept: "#2b2118", book: "#c28512", project: "#15803d", link: "rgba(43,33,24,0.18)", dim: "#d6cdbf", text: "#2b2118" },
};

const TYPE_LABEL = { concept: "Concept", book: "Book", project: "Project" } as const;

const endId = (end: string | Node) => (typeof end === "string" ? end : end.id);

export default function KnowledgeGraph3D({ nodes, links, compact = false }: { nodes: GraphNode[]; links: GraphLink[]; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<Node | null>(null);
  const [selected, setSelected] = useState<Node | null>(null);
  const { resolvedTheme } = useTheme();
  const colors = PALETTE[resolvedTheme === "light" ? "light" : "dark"];

  // Count each node's connections so well-connected ideas render bigger.
  const graphData = useMemo(() => {
    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }
    return {
      nodes: nodes.map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 })) as Node[],
      links: links.map((l) => ({ ...l })) as Link3D[],
    };
  }, [nodes, links]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of links) {
      if (!map.has(l.source)) map.set(l.source, new Set());
      if (!map.has(l.target)) map.set(l.target, new Set());
      map.get(l.source)!.add(l.target);
      map.get(l.target)!.add(l.source);
    }
    return map;
  }, [links]);

  // The hovered (or selected) node and its direct neighbours stay lit; everything else dims.
  const focus = hovered ?? selected;
  const isLit = useCallback(
    (id: string) => !focus || id === focus.id || !!neighbors.get(focus.id)?.has(id),
    [focus, neighbors],
  );
  const isLinkLit = useCallback(
    (l: Link3D) => !!focus && (endId(l.source) === focus.id || endId(l.target) === focus.id),
    [focus],
  );

  // Fill the container and follow its size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Slow idle rotation, paused while something is focused.
  useEffect(() => {
    const controls = fgRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = !focus;
    controls.autoRotateSpeed = 0.6;
  }, [focus, size.width]);

  const nodeLabelObject = useCallback(
    (node: Node) => {
      const sprite = new SpriteText(node.name);
      sprite.color = colors.text;
      sprite.textHeight = node.type === "concept" ? 3.2 : 2.6;
      sprite.fontFace = getComputedStyle(document.body).fontFamily; // canvas text needs the real family name
      sprite.fontWeight = node.type === "concept" ? "600" : "400";
      sprite.backgroundColor = false;
      sprite.center.set(0.5, -0.9); // sit just above the sphere
      return sprite;
    },
    [colors.text],
  );

  const flyTo = (node: Node) => {
    if (node.x === undefined || node.y === undefined || node.z === undefined) return;
    const distance = 70;
    const ratio = 1 + distance / Math.max(1, Math.hypot(node.x, node.y, node.z));
    fgRef.current?.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
      { x: node.x, y: node.y, z: node.z },
      1200,
    );
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {size.width > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
          controlType="orbit"
          enablePointerInteraction={!compact}
          nodeRelSize={4}
          nodeResolution={16}
          nodeVal={(n: Node) => (n.type === "concept" ? 2 : 1.2) + n.degree * 0.8}
          nodeColor={(n: Node) => (isLit(n.id) ? colors[n.type] : colors.dim)}
          nodeOpacity={0.95}
          nodeLabel={() => ""}
          nodeThreeObject={nodeLabelObject}
          nodeThreeObjectExtend
          linkColor={(l: Link3D) => {
            if (!isLinkLit(l)) return colors.link;
            const other = endId(l.source) === focus!.id ? l.target : l.source;
            return typeof other === "string" ? colors.concept : colors[other.type];
          }}
          linkWidth={(l: Link3D) => (isLinkLit(l) ? 1.2 : 0.4)}
          linkOpacity={0.6}
          linkDirectionalParticles={(l: Link3D) => (isLinkLit(l) ? 3 : 0)}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleSpeed={0.006}
          onNodeHover={(n: Node | null) => {
            setHovered(n);
            if (containerRef.current) containerRef.current.style.cursor = n ? "pointer" : "grab";
          }}
          onNodeClick={(n: Node) => {
            setSelected(n);
            flyTo(n);
          }}
          onBackgroundClick={() => setSelected(null)}
          cooldownTicks={120}
          onEngineStop={() => fgRef.current?.zoomToFit(800, 60)}
        />
      )}

      {compact && <div aria-hidden className="absolute inset-0" />}

      {/* Legend */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-3 font-mono sm:left-4 sm:top-4 sm:gap-4 text-[11px] uppercase tracking-widest text-muted-foreground">
        {(["concept", "book", "project"] as const).map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: colors[type] }} />
            {TYPE_LABEL[type]}s
          </span>
        ))}
      </div>

      {!compact && (
        <p className="pointer-events-none absolute bottom-4 left-4 hidden text-xs text-muted-foreground sm:block">
          Drag to orbit · scroll to zoom · click a node to focus
        </p>
      )}

      {/* Details for the clicked node */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="surface absolute inset-x-3 bottom-3 rounded-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-72 border bg-card/90 p-4 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: colors[selected.type] }} />
                {TYPE_LABEL[selected.type]} · {selected.status.replace(/-/g, " ")}
              </span>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 font-semibold leading-snug">{selected.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Connected to {neighbors.get(selected.id)?.size ?? 0} {neighbors.get(selected.id)?.size === 1 ? "item" : "items"}
            </p>
            <Link href={selected.href} className="group mt-3 inline-flex items-center text-sm font-medium underline-offset-4 hover:underline">
              Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
