import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { createToken, RESET_TOKEN_TTL, VERIFY_TOKEN_TTL } from "@/lib/tokens";

const linkFor = (path: string, email: string, token: string) =>
  `${siteUrl()}${path}?${new URLSearchParams({ email, token })}`;

/** Emails a link that confirms the address. Returns false if email isn't set up (the link is logged). */
export async function sendVerificationEmail(email: string, name?: string | null): Promise<boolean> {
  const token = await createToken("verify", email, VERIFY_TOKEN_TTL);
  return sendEmail({
    to: email,
    subject: "Confirm your email for Knowledge Tracker",
    text: [
      `Hi${name ? ` ${name}` : ""},`,
      "",
      "Confirm your email address to finish setting up your account:",
      linkFor("/verify-email", email, token),
      "",
      "The link works for 24 hours. If you didn't sign up, you can ignore this email.",
    ].join("\n"),
  });
}

/** Emails a link for choosing a new password. Returns false if email isn't set up (the link is logged). */
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  const token = await createToken("reset", email, RESET_TOKEN_TTL);
  return sendEmail({
    to: email,
    subject: "Reset your Knowledge Tracker password",
    text: [
      "Someone asked to reset the password for this account. Choose a new one here:",
      linkFor("/reset-password", email, token),
      "",
      "The link works for 1 hour. If it wasn't you, ignore this email and your password stays the same.",
    ].join("\n"),
  });
}
