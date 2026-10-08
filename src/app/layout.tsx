import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { BackgroundShapes } from "@/components/background-shapes";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import { getNavUser } from "@/db/queries";
import { isAdminEmail } from "@/lib/admin";

// One family for everything. Its optical-size axis keeps body text open and readable, and
// its width axis gives the narrow, heavy display cut used for names and years (.font-display).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-bricolage" });

// Link previews need absolute URLs. Set NEXT_PUBLIC_SITE_URL to the live address when deploying.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Knowledge Tracker",
  description: "A public timeline of your milestones, books, concepts and projects.",
  openGraph: { siteName: "Knowledge Tracker", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    title: "ArchitectKT",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#141824" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const found = session?.user?.id ? await getNavUser(session.user.id) : null;
  // A suspended account is shown as signed out.
  const navUser = found && !found.suspendedAt ? found : null;
  const username = navUser?.username ?? null;
  // Prefer the DB's name and picture over the copy baked into the session token.
  const navSession = session?.user && navUser
    ? { ...session, user: { ...session.user, image: navUser.image, name: navUser.name } }
    : found ? null : session;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolage.variable} min-h-screen overflow-x-clip bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <div className="relative isolate flex min-h-screen flex-col">
              <BackgroundShapes />
              <Navbar session={navSession} username={username} isAdmin={isAdminEmail(navUser?.email)} />
              <main className="flex-1 container mx-auto w-full min-w-0 px-4 py-6 sm:py-8">
                {children}
              </main>
            </div>
          </MotionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
