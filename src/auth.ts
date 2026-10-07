import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateUsername } from "@/lib/username";

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
  providers: [
    ...authConfig.providers.filter((p: any) => p.id !== "credentials"),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await db.query.users.findFirst({
            where: eq(users.email, email)
          });
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return user;
          }
        }
        
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
