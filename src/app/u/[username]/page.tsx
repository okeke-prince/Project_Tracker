import { permanentRedirect } from "next/navigation";

// Profiles used to live at /u/<username>. Keep old links working.
export default async function LegacyProfileRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  permanentRedirect(`/${username}`);
}
