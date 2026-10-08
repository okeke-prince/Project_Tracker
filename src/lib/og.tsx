// Shared look for the link-preview images (Open Graph cards) that chat apps and social
// sites show when someone shares a link. Rendered with next/og, which only supports flexbox.
import type { ReactNode } from "react";
import { markSvg } from "@/components/logo";

const MARK_SRC = `data:image/svg+xml;base64,${Buffer.from(markSvg({ fg: "#141824", bg: "#f1f3f7" })).toString("base64")}`;

export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#141824";
const FG = "#f1f3f7";
const MUTED = "#a3aab8";

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
        color: FG,
        fontFamily: "sans-serif",
      }}
    >
      {children}
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: MUTED }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_SRC} width={40} height={40} alt="" />
        Knowledge Tracker
      </div>
    </div>
  );
}

export function OgStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{label}</div>
    </div>
  );
}

export const OG_MUTED = MUTED;
