import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import { getNavUser } from "@/db/queries";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
// Display serif, used sparingly in italics for accent words in headings.
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif" });

export const metadata: Metadata = {
  title: "Knowledge Tracker",
  description: "Track your software architecture learning journey.",
  appleWebApp: {
    title: "ArchitectKT",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const navUser = session?.user?.id ? await getNavUser(session.user.id) : null;
  const username = navUser?.username ?? null;
  // Prefer the DB's name and picture over the copy baked into the session token.
  const navSession = session?.user && navUser
    ? { ...session, user: { ...session.user, image: navUser.image, name: navUser.name } }
    : session;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <div className="relative isolate flex min-h-screen flex-col">
              {/* Site-wide textures: a dot grid that fades out down the page, and a light film grain. */}
              <div aria-hidden className="bg-dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]" />
              <div aria-hidden className="bg-grain pointer-events-none fixed inset-0 z-[100]" />
              <Navbar session={navSession} username={username} />
              <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
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
