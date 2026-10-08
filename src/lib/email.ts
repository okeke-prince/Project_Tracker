// Sends email through Resend (https://resend.com) when RESEND_API_KEY is set. Without a key,
// nothing is sent: the email is printed to the server log instead, which is handy locally.

export type Email = { to: string | string[]; subject: string; text: string };

/** Sends an email. Returns false when no email service is set up and it was only logged. */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const level = process.env.NODE_ENV === "production" ? "error" : "info";
    console[level](`[email not sent: RESEND_API_KEY isn't set]\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Knowledge Tracker <onboarding@resend.dev>",
      to: email.to,
      subject: email.subject,
      text: email.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Couldn't send the email (Resend said ${response.status}: ${await response.text()})`);
  }
  return true;
}
