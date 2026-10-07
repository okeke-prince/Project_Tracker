// Shared look for the link-preview images (Open Graph cards) that chat apps and social
// sites show when someone shares a link. Rendered with next/og, which only supports flexbox.
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#0f0d0b";
const FG = "#f3ede2";
const MUTED = "#9a9186";

export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: BG,
        backgroundImage: "radial-gradient(circle, rgba(243,237,226,0.13) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        color: FG,
        fontFamily: "sans-serif",
      }}
    >
      {children}
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: MUTED }}>
        <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: FG }} />
        Knowledge Tracker
      </div>
    </div>
  );
}

export function OgStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 20, color: MUTED, textTransform: "uppercase", letterSpacing: 3 }}>{label}</div>
    </div>
  );
}

export const OG_MUTED = MUTED;
