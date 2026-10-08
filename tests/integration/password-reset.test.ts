import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requestPasswordReset, resetPassword } from "@/app/actions/account";
import { sendEmail } from "@/lib/email";
import { resetTestDb } from "../helpers/test-db";
import { createUser } from "../helpers/fixtures";
import { useNewIp } from "../helpers/request";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/headers", () => import("../helpers/request"));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

/** The token from the link in the last email we "sent". */
function tokenFromLastEmail() {
  const { text } = vi.mocked(sendEmail).mock.lastCall![0];
  const link = new URL(text.match(/https?:\/\/\S+/)![0]);
  return { email: link.searchParams.get("email")!, token: link.searchParams.get("token")!, path: link.pathname };
}

async function passwordOf(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row;
}

// Rate limits are counted per email for the whole test run, so each test gets its own person.
let n = 0;
let ADA = "";

beforeEach(async () => {
  vi.clearAllMocks();
  resetTestDb(db);
  useNewIp();
  const user = await createUser(db, { username: `ada-${++n}` });
  ADA = user.email!;
  await db.update(users).set({ password: await bcrypt.hash("old-password", 4) }).where(eq(users.id, user.id));
});

describe("forgot password", () => {
  it("emails a reset link to the account", async () => {
    const result = await requestPasswordReset(null, form({ email: ADA.toUpperCase() }));
    expect(result).toMatchObject({ success: true });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(vi.mocked(sendEmail).mock.lastCall![0].to).toBe(ADA);
    expect(tokenFromLastEmail()).toMatchObject({ path: "/reset-password", email: ADA });
  });

  it("gives the same answer for unknown emails, without sending anything", async () => {
    const known = await requestPasswordReset(null, form({ email: ADA }));
    const unknown = await requestPasswordReset(null, form({ email: "nobody@example.test" }));
    expect(unknown).toEqual(known);
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("limits how often one address can ask", async () => {
    for (let i = 0; i < 3; i++) await requestPasswordReset(null, form({ email: ADA }));
    useNewIp();
    expect(await requestPasswordReset(null, form({ email: ADA }))).toMatchObject({ success: false });
  });
});

describe("reset password", () => {
  beforeEach(async () => {
    await requestPasswordReset(null, form({ email: ADA }));
  });

  it("sets the new password and confirms the email", async () => {
    const { email, token } = tokenFromLastEmail();
    await expect(resetPassword(null, form({ email, token, password: "new-password", confirm: "new-password" }))).rejects.toThrow("redirect:/login?reset=1");

    const user = await passwordOf(email);
    expect(await bcrypt.compare("new-password", user.password!)).toBe(true);
    expect(user.emailVerified).toBeInstanceOf(Date);
  });

  it("only works once", async () => {
    const { email, token } = tokenFromLastEmail();
    await resetPassword(null, form({ email, token, password: "new-password", confirm: "new-password" })).catch(() => {});
    const again = await resetPassword(null, form({ email, token, password: "another-one", confirm: "another-one" }));
    expect(again).toMatchObject({ success: false, error: expect.stringContaining("expired") });
  });

  it("rejects a wrong token or a token for another email", async () => {
    const { token } = tokenFromLastEmail();
    expect(await resetPassword(null, form({ email: ADA, token: "nope", password: "new-password", confirm: "new-password" }))).toMatchObject({ success: false });
    expect(await resetPassword(null, form({ email: "eve@example.test", token, password: "new-password", confirm: "new-password" }))).toMatchObject({ success: false });
    expect(await bcrypt.compare("old-password", (await passwordOf(ADA)).password!)).toBe(true);
  });

  it("rejects an expired link", async () => {
    const { email, token } = tokenFromLastEmail();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 61 * 60 * 1000);
    try {
      expect(await resetPassword(null, form({ email, token, password: "new-password", confirm: "new-password" }))).toMatchObject({ success: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it("checks the new password before using up the link", async () => {
    const { email, token } = tokenFromLastEmail();
    expect(await resetPassword(null, form({ email, token, password: "short", confirm: "short" }))).toMatchObject({ error: "Use at least 8 characters." });
    expect(await resetPassword(null, form({ email, token, password: "new-password", confirm: "different" }))).toMatchObject({ error: "The passwords don't match." });
    await expect(resetPassword(null, form({ email, token, password: "new-password", confirm: "new-password" }))).rejects.toThrow("redirect:");
  });
});
