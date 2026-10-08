import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { register } from "@/app/actions/auth";
import { resendVerification } from "@/app/actions/account";
import { GET as verifyEmail } from "@/app/(auth)/verify-email/route";
import { checkCredentials } from "@/lib/credentials";
import { sendEmail } from "@/lib/email";
import { resetTestDb } from "../helpers/test-db";
import { useNewIp } from "../helpers/request";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => import("../helpers/request"));
vi.mock("@/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));

let n = 0;

function signUpForm(overrides: Record<string, string> = {}) {
  n += 1;
  const data = new FormData();
  const values = { name: "Ada Lovelace", username: `ada-${n}`, email: `Ada.${n}@Example.test`, password: "correct-horse", ...overrides };
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

function linkFromLastEmail() {
  const { text } = vi.mocked(sendEmail).mock.lastCall![0];
  return new URL(text.match(/https?:\/\/\S+/)![0]);
}

async function userByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetTestDb(db);
  useNewIp();
});

describe("sign-up", () => {
  it("creates an unconfirmed account with a lower-case email and sends a confirmation link", async () => {
    const result = await register(null, signUpForm());
    expect(result).toMatchObject({ success: true, email: `ada.${n}@example.test`, emailSent: true });

    const user = await userByEmail(`ada.${n}@example.test`);
    expect(user).toMatchObject({ username: `ada-${n}`, emailVerified: null });
    expect(linkFromLastEmail().pathname).toBe("/verify-email");
  });

  it("still creates the account if the email can't be sent", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend is down"));
    expect(await register(null, signUpForm())).toMatchObject({ success: true, emailSent: false });
  });
});

describe("password sign-in", () => {
  it("is refused until the email is confirmed, but only for the right password", async () => {
    await register(null, signUpForm());
    const email = `ada.${n}@example.test`;
    expect(await checkCredentials(email, "correct-horse")).toEqual({ ok: false, reason: "unverified" });
    expect(await checkCredentials(email, "wrong-password")).toEqual({ ok: false, reason: "invalid" });
  });

  it("works once the link has been opened, and ignores email case", async () => {
    await register(null, signUpForm());
    const response = await verifyEmail(new NextRequest(linkFromLastEmail()));
    expect(response.headers.get("location")).toContain("/login?verified=1");

    const result = await checkCredentials(`ADA.${n}@EXAMPLE.TEST`, "correct-horse");
    expect(result).toMatchObject({ ok: true, user: { username: `ada-${n}` } });
  });

  it("is refused for suspended accounts", async () => {
    await register(null, signUpForm());
    const email = `ada.${n}@example.test`;
    await db.update(users).set({ emailVerified: new Date(), suspendedAt: new Date() }).where(eq(users.email, email));
    expect(await checkCredentials(email, "correct-horse")).toEqual({ ok: false, reason: "suspended" });
  });
});

describe("confirmation link", () => {
  it("can't be reused or guessed", async () => {
    await register(null, signUpForm());
    const link = linkFromLastEmail();
    await verifyEmail(new NextRequest(link));
    expect((await verifyEmail(new NextRequest(link))).headers.get("location")).toContain("verify=expired");

    link.searchParams.set("token", "guess");
    expect((await verifyEmail(new NextRequest(link))).headers.get("location")).toContain("verify=expired");
  });

  it("only confirms the email it was sent to", async () => {
    await register(null, signUpForm());
    const link = linkFromLastEmail();
    await register(null, signUpForm());
    link.searchParams.set("email", `ada.${n}@example.test`); // the second person's address
    await verifyEmail(new NextRequest(link));
    expect((await userByEmail(`ada.${n}@example.test`))?.emailVerified).toBeNull();
  });

  it("can be sent again, but not for confirmed accounts", async () => {
    await register(null, signUpForm());
    const email = `ada.${n}@example.test`;
    vi.mocked(sendEmail).mockClear();

    const data = new FormData();
    data.append("email", email);
    expect(await resendVerification(null, data)).toMatchObject({ success: true });
    expect(sendEmail).toHaveBeenCalledOnce();

    await verifyEmail(new NextRequest(linkFromLastEmail()));
    vi.mocked(sendEmail).mockClear();
    expect(await resendVerification(null, data)).toMatchObject({ success: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
