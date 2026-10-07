import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation will happen in auth.ts where the database is available
        return null; // This will be overridden in auth.ts
      }
    })
  ],
  pages: {
    signIn: '/login',
    // Sign-in errors (like an email already used with a password) come back to the login page.
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnManage = nextUrl.pathname.startsWith('/manage');
      
      const isProtectedRoute = isOnManage;

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
    async session({ session, token }) {
      // With the JWT strategy there is no `user` here; the user id lives in token.sub.
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
} satisfies NextAuthConfig;
