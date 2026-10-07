import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { saveProfile } from "@/app/actions/mutations";
import { GET as downloadCv } from "@/app/api/cv/[username]/route";
import { deleteCv, readCv, uploadCv } from "@/lib/storage";
import { resetTestDb } from "../helpers/test-db";
import { signInAs, signOutUser } from "../helpers/session";
import { createUser } from "../helpers/fixtures";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => import("../helpers/session"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Keep the real checks (isPdf, size limits) but don't touch the disk.
vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  uploadCv: vi.fn(),
  deleteCv: vi.fn(async () => {}),
  readCv: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(async () => {}),
}));

const PDF = "%PDF-1.7\n% a tiny pretend CV";

function profileForm(extra: Record<string, string | File> = {}) {
  const data = new FormData();
  data.append("name", "Ada Lovelace");
  data.append("username", "ada");
  data.append("headline", "");
  data.append("bio", "");
  for (const [key, value] of Object.entries(extra)) data.append(key, value);
  return data;
}

async function cvUpdatedAt(userId: string) {
  const [row] = await db.select({ cvUpdatedAt: users.cvUpdatedAt }).from(users).where(eq(users.id, userId));
  return row.cvUpdatedAt;
}

let ada: { id: string };

beforeEach(async () => {
  vi.clearAllMocks();
  resetTestDb(db);
  signOutUser();
  ada = await createUser(db, { username: "ada", name: "Ada Lovelace" });
});

describe("saveProfile", () => {
  it("saves name, headline and bio", async () => {
    signInAs(ada.id);
    const data = profileForm();
    data.set("headline", "Analyst");
    data.set("bio", "First programmer.");
    expect(await saveProfile(null, data)).toMatchObject({ success: true });
    const [row] = await db.select().from(users).where(eq(users.id, ada.id));
    expect(row).toMatchObject({ name: "Ada Lovelace", headline: "Analyst", bio: "First programmer." });
  });

  it("rejects a username someone else has", async () => {
    await createUser(db, { username: "grace" });
    signInAs(ada.id);
    const data = profileForm();
    data.set("username", "grace");
    expect(await saveProfile(null, data)).toMatchObject({ success: false, error: "That username is already taken." });
  });

  it("rejects reserved usernames", async () => {
    signInAs(ada.id);
    const data = profileForm();
    data.set("username", "Manage");
    expect(await saveProfile(null, data)).toMatchObject({ success: false, error: "That username is reserved." });
  });
});

describe("CV upload", () => {
  it("stores a PDF and records when it was uploaded", async () => {
    signInAs(ada.id);
    const result = await saveProfile(null, profileForm({ cv: new File([PDF], "cv.pdf", { type: "application/pdf" }) }));
    expect(result).toMatchObject({ success: true });
    expect(uploadCv).toHaveBeenCalledWith(ada.id, expect.any(File));
    expect(await cvUpdatedAt(ada.id)).toBeInstanceOf(Date);
  });

  it("rejects files that aren't really PDFs, whatever their name", async () => {
    signInAs(ada.id);
    const fake = new File(["<html>not a pdf</html>"], "cv.pdf", { type: "application/pdf" });
    expect(await saveProfile(null, profileForm({ cv: fake }))).toMatchObject({ success: false, error: "Upload your CV as a PDF." });
    expect(uploadCv).not.toHaveBeenCalled();
    expect(await cvUpdatedAt(ada.id)).toBeNull();
  });

  it("rejects CVs over 5 MB", async () => {
    signInAs(ada.id);
    const big = new File([PDF, new Uint8Array(5 * 1024 * 1024)], "cv.pdf", { type: "application/pdf" });
    expect(await saveProfile(null, profileForm({ cv: big }))).toMatchObject({ success: false, error: "CVs can be up to 5 MB." });
    expect(uploadCv).not.toHaveBeenCalled();
  });

  it("removes the CV when asked", async () => {
    await db.update(users).set({ cvUpdatedAt: new Date() }).where(eq(users.id, ada.id));
    signInAs(ada.id);
    expect(await saveProfile(null, profileForm({ removeCv: "on" }))).toMatchObject({ success: true });
    expect(deleteCv).toHaveBeenCalledWith(ada.id);
    expect(await cvUpdatedAt(ada.id)).toBeNull();
  });

  it("leaves an existing CV alone when the profile is saved without a new one", async () => {
    const uploaded = new Date("2026-01-01T00:00:00Z");
    await db.update(users).set({ cvUpdatedAt: uploaded }).where(eq(users.id, ada.id));
    signInAs(ada.id);
    expect(await saveProfile(null, profileForm({ cv: new File([], "") }))).toMatchObject({ success: true });
    expect(await cvUpdatedAt(ada.id)).toEqual(uploaded);
    expect(deleteCv).not.toHaveBeenCalled();
  });
});

describe("GET /api/cv/<username>", () => {
  const get = (username: string) =>
    downloadCv(new NextRequest(`http://localhost/api/cv/${username}`), { params: Promise.resolve({ username }) });

  it("downloads the CV as a PDF named after the person", async () => {
    await db.update(users).set({ cvUpdatedAt: new Date() }).where(eq(users.id, ada.id));
    vi.mocked(readCv).mockResolvedValue(Buffer.from(PDF));

    const response = await get("ada");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain('attachment; filename="Ada Lovelace - CV.pdf"');
    expect(await response.text()).toBe(PDF);
    expect(readCv).toHaveBeenCalledWith(ada.id);
  });

  it("works for anyone, signed in or not, and with an @ in front", async () => {
    await db.update(users).set({ cvUpdatedAt: new Date() }).where(eq(users.id, ada.id));
    vi.mocked(readCv).mockResolvedValue(Buffer.from(PDF));
    expect((await get("@ada")).status).toBe(200);
  });

  it("is a 404 when the person hasn't uploaded a CV", async () => {
    vi.mocked(readCv).mockResolvedValue(Buffer.from(PDF)); // a stale file must not leak out
    expect((await get("ada")).status).toBe(404);
    expect(readCv).not.toHaveBeenCalled();
  });

  it("is a 404 for unknown people", async () => {
    expect((await get("nobody")).status).toBe(404);
  });
});
