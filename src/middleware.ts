import NextAuth from 'next-auth';
import authConfig from './auth.config';

// Next.js needs the middleware to be a plain function export it can see without running the file.
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
