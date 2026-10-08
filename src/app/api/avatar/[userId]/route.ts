import { NextRequest, NextResponse } from "next/server";
import { readAvatar } from "@/lib/storage";

// Profile pictures are public, so no session check here.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const avatar = await readAvatar(userId);
  if (!avatar) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(avatar.body), {
    headers: {
      "Content-Type": avatar.contentType,
      // The image URL carries a ?v= version that changes on every upload, so it can be cached for long.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
