import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookConcepts, books, conceptProjects, concepts, milestones, projects, users } from "@/db/schema";
import { deleteAccount } from "@/app/actions/auth";
import { deleteAvatar, deleteBookFile, deleteCv } from "@/lib/storage";
import { signOut } from "@/auth";
import { resetTestDb } from "../helpers/test-db";
import { signInAs, signOutUser } from "../helpers/session";
import { createBook, createConcept, createMilestone, createProject, createUser } from "../helpers/fixtures";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => import("../helpers/session"));
vi.mock("@/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  deleteAvatar: vi.fn(async () => {}),
  deleteBookFile: vi.fn(async () => {}),
  deleteCv: vi.fn(async () => {}),
}));

let ada: { id: string };
let grace: { id: string };

async function seed(userId: string, prefix: string) {
  const book = await createBook(db, userId, { title: `${prefix} book`, fileUrl: `local://books/${prefix}.pdf` });
  const concept = await createConcept(db, userId, { name: `${prefix} concept` });
  const project = await createProject(db, userId, { name: `${prefix} project` });
  await createMilestone(db, userId, { title: `${prefix} milestone` });
  await db.insert(bookConcepts).values({ bookId: book.id, conceptId: concept.id });
  await db.insert(conceptProjects).values({ conceptId: concept.id, projectId: project.id });
}

beforeEach(async () => {
  vi.clearAllMocks();
  resetTestDb(db);
  signOutUser();
  ada = await createUser(db, { username: "ada" });
  grace = await createUser(db, { username: "grace" });
  await seed(ada.id, "ada");
  await seed(grace.id, "grace");
});

describe("deleteAccount", () => {
  it("needs the username typed exactly", async () => {
    signInAs(ada.id);
    expect(await deleteAccount("grace")).toMatchObject({ success: false });
    expect(await db.select().from(users).where(eq(users.id, ada.id))).toHaveLength(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("removes the user, everything they added and their files, then signs them out", async () => {
    signInAs(ada.id);
    expect(await deleteAccount("  ADA ")).toMatchObject({ success: true });

    expect(await db.select().from(users).where(eq(users.id, ada.id))).toHaveLength(0);
    for (const table of [books, concepts, projects, milestones]) {
      expect(await db.select().from(table).where(eq(table.userId, ada.id))).toHaveLength(0);
    }
    expect(deleteBookFile).toHaveBeenCalledWith("local://books/ada.pdf");
    expect(deleteAvatar).toHaveBeenCalledWith(ada.id);
    expect(deleteCv).toHaveBeenCalledWith(ada.id);
    expect(signOut).toHaveBeenCalled();
  });

  it("leaves other people's data alone", async () => {
    signInAs(ada.id);
    await deleteAccount("ada");

    expect(await db.select().from(users)).toHaveLength(1);
    for (const table of [books, concepts, projects, milestones]) {
      expect(await db.select().from(table).where(eq(table.userId, grace.id))).toHaveLength(1);
    }
    expect(await db.select().from(bookConcepts)).toHaveLength(1);
    expect(await db.select().from(conceptProjects)).toHaveLength(1);
    expect(deleteBookFile).not.toHaveBeenCalledWith("local://books/grace.pdf");
  });

  it("does nothing for signed-out visitors", async () => {
    await expect(deleteAccount("ada")).rejects.toThrow("You need to be signed in");
    expect(await db.select().from(users)).toHaveLength(2);
  });
});
