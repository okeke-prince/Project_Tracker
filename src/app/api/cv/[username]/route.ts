import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/db/queries";
import { readCv } from "@/lib/storage";

// CVs are public, like the rest of a profile, so there's no session check.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username).replace(/^@/, "");
  const user = await getUserByUsername(username);
  const cv = user?.cvUpdatedAt ? await readCv(user.id) : null;
  if (!user || !cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const name = `${user.name || user.username} - CV.pdf`;
  const asciiName = name.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "CV.pdf";
  return new NextResponse(new Uint8Array(cv), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      // Links carry ?v=<upload time>, so a new upload gets a new URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
