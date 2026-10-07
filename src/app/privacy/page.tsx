import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy policy · Knowledge Tracker",
  description: "What Knowledge Tracker collects, what is public on your profile, and how to delete your data.",
};

const UPDATED = "October 7, 2026";
// Where people can reach whoever runs the site about their data.
const CONTACT_URL = "https://github.com/okeke-prince";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Last updated {UPDATED}</p>
        <h1 className="text-4xl sm:text-5xl tracking-tight text-accent-serif">Privacy policy</h1>
        <p className="text-muted-foreground leading-relaxed">
          Knowledge Tracker lets you publish a timeline of what you&apos;ve learned and built. This page explains what we
          store, what other people can see, and how to remove it.
        </p>
      </header>

      <Section title="What we collect">
        <ul>
          <li><strong>Account details:</strong> your name, email address, username, and a hashed password (we never store the password itself). If you sign in with Google, we receive your name, email and profile picture from Google.</li>
          <li><strong>Profile:</strong> your headline, bio and any profile picture you upload.</li>
          <li><strong>What you add:</strong> books (title, authors, status, rating, reading progress, notes and any file you upload), concepts, projects and milestones.</li>
          <li><strong>Security data:</strong> your IP address is held briefly in memory to limit repeated sign-in and sign-up attempts. It is not saved to the database.</li>
        </ul>
      </Section>

      <Section title="What is public">
        <p>Your profile at <span className="font-mono text-sm">/your-username</span> can be seen by anyone, including people without an account. It shows:</p>
        <ul>
          <li>Your name, username, profile picture, headline and bio.</li>
          <li>Your milestones, projects (including any repository links), concepts and how they connect.</li>
          <li>The books you&apos;ve added, with their status and rating.</li>
        </ul>
      </Section>

      <Section title="What stays private">
        <ul>
          <li>Your email address and password.</li>
          <li>Book files you upload. Only you can open or download them.</li>
          <li>Your reading progress and your notes on books and concepts.</li>
        </ul>
      </Section>

      <Section title="Cookies">
        <p>We only use cookies the site needs to work, so there&apos;s nothing to opt in or out of:</p>
        <ul>
          <li><strong>Session:</strong> keeps you signed in. It lasts up to 30 days and renews while you use the site.</li>
          <li><strong>Security:</strong> protects the sign-in form against forged requests.</li>
          <li><strong>Sign-in redirect:</strong> remembers which page to return you to after signing in.</li>
        </ul>
        <p>
          Your light or dark theme choice is saved in your browser&apos;s storage, not in a cookie. We don&apos;t use
          analytics, advertising or tracking cookies.
        </p>
      </Section>

      <Section title="Who else handles your data">
        <ul>
          <li><strong>Google</strong>, if you choose to sign in with Google.</li>
          <li><strong>Amazon Web Services (S3)</strong>, which may store uploaded book files and profile pictures.</li>
        </ul>
        <p>We don&apos;t sell your data or share it with anyone else.</p>
      </Section>

      <Section title="Deleting your data">
        <p>
          You can edit or remove anything you&apos;ve added at any time in <Link href="/manage">Manage</Link>. To delete
          everything, go to <Link href="/manage?tab=profile">Manage → Profile</Link> and choose{" "}
          <strong>Delete account</strong>. This permanently removes your profile, everything you&apos;ve added and your
          uploaded files.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If this policy changes, we&apos;ll update the date at the top of this page. For questions about your data,
          get in touch through <a href={CONTACT_URL} target="_blank" rel="noreferrer">GitHub</a>.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 text-muted-foreground leading-relaxed [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}
