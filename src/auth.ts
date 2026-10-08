import NextAuth, { CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateUsername } from "@/lib/username";
import { clientIp, FIFTEEN_MINUTES, rateLimit } from "@/lib/rate-limit";
import { checkCredentials } from "@/lib/credentials";

/** Thrown when someone has tried too many passwords; the sign-in form shows its own message for it. */
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

class EmailNotVerified extends CredentialsSignin {
  code = "unverified";
}

class AccountSuspended extends CredentialsSignin {
  code = "suspended";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  events: {
    // Google sign-ups skip the register form, so give them a username here.
    async createUser({ user }) {
      if (!user.id) return;
      const existing = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (existing?.username) return;
      const username = await generateUsername(user.email || user.name || "user");
      await db.update(users).set({ username }).where(eq(users.id, user.id));
    },
  },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Suspended accounts can't sign in with Google or GitHub either.
    async signIn({ user }) {
      if (!user.email) return true;
      const existing = await db.query.users.findFirst({ where: eq(users.email, user.email.toLowerCase()), columns: { suspendedAt: true } });
      return !existing?.suspendedAt;
    },
  },
  providers: [
    ...authConfig.providers.filter((p: any) => p.id !== "credentials"),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Slow down password guessing: 10 tries per account and 30 per address every 15 minutes.
        const ip = clientIp(request.headers);
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "";
        if (!rateLimit(`login:${ip}`, 30, FIFTEEN_MINUTES) || !rateLimit(`login:${ip}:${email}`, 10, FIFTEEN_MINUTES)) {
          throw new TooManyAttempts();
        }

        // Older accounts may have 6-character passwords, so sign-in only checks one is present.
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(credentials);
        if (!parsed.success) return null;

        const result = await checkCredentials(parsed.data.email, parsed.data.password);
        if (result.ok) return result.user;
        if (result.reason === "unverified") throw new EmailNotVerified();
        if (result.reason === "suspended") throw new AccountSuspended();
        return null;
      },
    }),
  ],
});
