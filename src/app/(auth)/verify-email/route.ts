import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumeToken } from "@/lib/tokens";

// The link in the confirmation email lands here, then sends the person on to sign in.
export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get("email") ?? "").toLowerCase();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const login = new URL("/login", request.nextUrl);

  if (await consumeToken("verify", email, token)) {
    await db.update(users).set({ emailVerified: new Date() }).where(and(eq(users.email, email), isNull(users.emailVerified)));
    login.searchParams.set("verified", "1");
  } else {
    login.searchParams.set("verify", "expired");
  }
  return NextResponse.redirect(login);
}
