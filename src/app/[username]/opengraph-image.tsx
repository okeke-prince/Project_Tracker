import { ImageResponse } from "next/og";
import { getPublicLibrary, getTimeline, getUserByUsername } from "@/db/queries";
import { OG_MUTED, OG_SIZE, OgFrame, OgStat } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Profile timeline";

export default async function ProfileImage({ params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username).replace(/^@/, "");
  const user = await getUserByUsername(username);

  if (!user) {
    return new ImageResponse(
      <OgFrame>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>Profile not found</div>
      </OgFrame>,
      size,
    );
  }

  const [library, timeline] = await Promise.all([getPublicLibrary(user.id), getTimeline(user.id)]);
  const name = user.name || user.username!;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return new ImageResponse(
    <OgFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 999,
              border: "2px solid rgba(243,237,226,0.25)",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", fontSize: 26, color: OG_MUTED }}>@{user.username}</div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>{name}</div>
          </div>
        </div>
        {user.headline && (
          <div style={{ display: "flex", fontSize: 32, color: OG_MUTED, maxWidth: 1000 }}>{user.headline}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 72 }}>
        <OgStat value={library.projects.length} label="Projects" />
        <OgStat value={library.books.filter((b) => b.status === "finished").length} label="Books read" />
        <OgStat value={library.concepts.length} label="Concepts" />
        <OgStat value={timeline.filter((e) => e.kind === "milestone").length} label="Milestones" />
      </div>
    </OgFrame>,
    size,
  );
}
