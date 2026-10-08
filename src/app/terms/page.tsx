import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of service · Knowledge Tracker",
  description: "The rules for using Knowledge Tracker: what you can post, who owns it, and what happens if something breaks the rules.",
};

const UPDATED = "October 7, 2026";
// Where people can reach whoever runs the site.
const CONTACT_URL = "https://github.com/okeke-prince";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10 py-4">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Last updated {UPDATED}</p>
        <h1 className="text-4xl sm:text-5xl font-display">Terms of service</h1>
        <p className="text-muted-foreground leading-relaxed">
          These terms apply when you use Knowledge Tracker. By creating an account you agree to them. They&apos;re written
          to be read, so they&apos;re short.
        </p>
      </header>

      <Section title="Your account">
        <ul>
          <li>Use your own name and details. Don&apos;t create a profile pretending to be someone else.</li>
          <li>Keep your password to yourself. You&apos;re responsible for what happens on your account.</li>
          <li>You need to be old enough to agree to these terms where you live, and at least 13.</li>
        </ul>
      </Section>

      <Section title="What you post">
        <p>
          You own what you add: your profile, CV, notes, milestones, concepts and projects. You give us permission to
          store it and to show the public parts on your profile, which is what the site is for. You can delete it at any
          time, and deleting your account removes it.
        </p>
        <p>You must not post anything that:</p>
        <ul>
          <li>you don&apos;t have the right to share, such as someone else&apos;s CV or copyrighted work;</li>
          <li>harasses, threatens or is hateful towards anyone;</li>
          <li>is spam, a scam, or misleading about who you are or what you&apos;ve done;</li>
          <li>is illegal, or contains malware.</li>
        </ul>
      </Section>

      <Section title="Book files">
        <p>
          Only upload book files you&apos;re allowed to have, such as books you bought DRM-free or that are freely licensed.
          Uploaded files are private: only you can open or download them. Other people only see the title, author and
          your rating. Don&apos;t use the site to share or store pirated books.
        </p>
      </Section>

      <Section title="Reports and takedowns">
        <p>
          Every public profile has a <strong>Report</strong> link. Use it if a profile copies your work, pretends to be you
          or someone else, or breaks these rules in another way. For copyright, include what the work is and that you own
          it. You can also reach us through <a href={CONTACT_URL} target="_blank" rel="noreferrer">GitHub</a>.
        </p>
        <p>
          If something breaks these rules, we may remove it, suspend the account (which hides the profile and blocks
          sign-in), or delete the account. We&apos;ll usually act on clear cases without warning.
        </p>
      </Section>

      <Section title="The service">
        <p>
          Knowledge Tracker is provided as it is, without guarantees. We try to keep it running and your data safe, but
          keep your own copies of anything important, such as your CV. We may change or stop the service, and if these
          terms change we&apos;ll update the date at the top of this page.
        </p>
        <p>
          The <Link href="/privacy">privacy policy</Link> explains what we collect and what is public.
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
