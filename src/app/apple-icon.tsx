import { ImageResponse } from "next/og";
import { markSvg } from "@/components/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the tile is drawn square.
export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg({ radius: 0 })).toString("base64")}`;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={180} height={180} alt="" />,
    size,
  );
}
