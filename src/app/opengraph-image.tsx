import { ImageResponse } from "next/og";
import { OG_MUTED, OG_SIZE, OgFrame } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Knowledge Tracker: show what you've learned and built";

export default function SiteImage() {
  return new ImageResponse(
    <OgFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 40 }}>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, maxWidth: 1000 }}>
          Show what you&apos;ve learned and built.
        </div>
        <div style={{ display: "flex", fontSize: 32, color: OG_MUTED, maxWidth: 900 }}>
          One public timeline for your milestones, books, concepts and projects.
        </div>
      </div>
    </OgFrame>,
    size,
  );
}
