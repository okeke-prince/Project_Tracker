import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { deleteUserAsAdmin, restoreUser, setReportStatus, submitReport, suspendUser } from "@/app/actions/moderation";
import { search } from "@/app/actions/search";
import { getUserByUsername } from "@/db/queries";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { resetTestDb } from "../helpers/test-db";
import { signInAs, signOutUser } from "../helpers/session";
import { useNewIp } from "../helpers/request";
import { createUser } from "../helpers/fixtures";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => import("../helpers/session"));
vi.mock("next/headers", () => import("../helpers/request"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));
vi.mock("@/lib/storage", () => ({
  deleteAvatar: vi.fn(async () => {}),
  deleteBookFile: vi.fn(async () => {}),
  deleteCv: vi.fn(async () => {}),
}));

function reportForm(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

let admin: { id: string };
let ada: { id: string };
let eve: { id: string };

beforeAll(() => vi.stubEnv("ADMIN_EMAILS", "Boss@example.test, other@example.test"));
afterAll(() => vi.unstubAllEnvs());

beforeEach(async () => {
  vi.clearAllMocks();
  resetTestDb(db);
  signOutUser();
  useNewIp();
  admin = await createUser(db, { username: "boss" });
  ada = await createUser(db, { username: "ada", name: "Ada Lovelace" });
  eve = await createUser(db, { username: "eve", name: "Eve Impostor" });
});

describe("admins", () => {
  it("are the emails listed in ADMIN_EMAILS, in any case", () => {
    expect(isAdminEmail("boss@example.test")).toBe(true);
    expect(isAdminEmail("OTHER@example.test")).toBe(true);
    expect(isAdminEmail("ada@example.test")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});

describe("reporting a profile", () => {
  it("works for signed-out visitors and emails the admins", async () => {
    const result = await submitReport(null, reportForm({ username: "eve", reason: "impersonation", details: "Copies Ada's CV" }));
    expect(result).toEqual({ success: true });

    const [report] = await db.select().from(reports);
    expect(report).toMatchObject({ reportedUserId: eve.id, reporterId: null, reason: "impersonation", status: "open", details: "Copies Ada's CV" });
    expect(vi.mocked(sendEmail).mock.lastCall![0]).toMatchObject({ to: ["Boss@example.test", "other@example.test"], subject: expect.stringContaining("@eve") });
  });

  it("records who reported, when signed in", async () => {
    signInAs(ada.id);
    await submitReport(null, reportForm({ username: "eve", reason: "spam" }));
    const [report] = await db.select().from(reports);
    expect(report.reporterId).toBe(ada.id);
  });

  it("checks the reason, the profile and who is reporting", async () => {
    expect(await submitReport(null, reportForm({ username: "eve", reason: "toString" }))).toMatchObject({ success: false, error: "Pick a reason." });
    expect(await submitReport(null, reportForm({ username: "eve", reason: "other" }))).toMatchObject({ success: false, error: "Tell us what's wrong." });
    expect(await submitReport(null, reportForm({ username: "nobody", reason: "spam" }))).toMatchObject({ success: false });
    signInAs(eve.id);
    expect(await submitReport(null, reportForm({ username: "eve", reason: "spam" }))).toMatchObject({ success: false, error: "You can't report your own profile." });
    expect(await db.select().from(reports)).toHaveLength(0);
  });

  it("is limited to 5 reports an hour from one address", async () => {
    for (let i = 0; i < 5; i++) await submitReport(null, reportForm({ username: "eve", reason: "spam" }));
    expect(await submitReport(null, reportForm({ username: "eve", reason: "spam" }))).toMatchObject({ success: false });
    expect(await db.select().from(reports)).toHaveLength(5);
  });
});

describe("admin actions", () => {
  it("are refused for everyone else", async () => {
    signInAs(ada.id);
    await expect(suspendUser(eve.id)).rejects.toThrow("Only admins");
    await expect(deleteUserAsAdmin(eve.id)).rejects.toThrow("Only admins");
    signOutUser();
    await expect(restoreUser(eve.id)).rejects.toThrow("Only admins");
  });

  it("aren't available to a suspended admin", async () => {
    await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, admin.id));
    signInAs(admin.id);
    await expect(suspendUser(eve.id)).rejects.toThrow("Only admins");
  });

  it("suspending hides the profile everywhere and closes its reports", async () => {
    await submitReport(null, reportForm({ username: "eve", reason: "impersonation" }));
    signInAs(admin.id);
    expect(await suspendUser(eve.id)).toEqual({ success: true });

    expect(await getUserByUsername("eve")).toBeUndefined();
    expect(await getUserByUsername("eve", { includeSuspended: true })).toMatchObject({ username: "eve" });
    expect((await search("eve")).map((r) => r.title)).toEqual([]);
    const [report] = await db.select().from(reports);
    expect(report.status).toBe("resolved");
  });

  it("restoring brings the profile back", async () => {
    signInAs(admin.id);
    await suspendUser(eve.id);
    await restoreUser(eve.id);
    expect(await getUserByUsername("eve")).toMatchObject({ username: "eve" });
  });

  it("can dismiss a report without touching the account", async () => {
    await submitReport(null, reportForm({ username: "ada", reason: "spam" }));
    const [report] = await db.select().from(reports);
    signInAs(admin.id);
    await setReportStatus(report.id, "dismissed");
    expect((await db.select().from(reports))[0].status).toBe("dismissed");
    expect(await getUserByUsername("ada")).toBeDefined();
  });

  it("can delete an account, but not their own", async () => {
    await submitReport(null, reportForm({ username: "eve", reason: "spam" }));
    signInAs(admin.id);
    expect(await deleteUserAsAdmin(admin.id)).toMatchObject({ success: false });
    expect(await deleteUserAsAdmin(eve.id)).toEqual({ success: true });
    expect(await db.select().from(users).where(eq(users.id, eve.id))).toHaveLength(0);
    expect(await db.select().from(reports)).toHaveLength(0);
    expect(await suspendUser(admin.id)).toMatchObject({ success: false });
  });
});
