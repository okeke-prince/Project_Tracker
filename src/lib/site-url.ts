/** The site's public address, for links in emails and previews. Set NEXT_PUBLIC_SITE_URL when deploying. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}
