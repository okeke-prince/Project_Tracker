import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { books, conceptProjects, milestones, projects } from "@/db/schema";
import { deleteBook, deleteMilestone, saveMilestone, saveProject } from "@/app/actions/mutations";
import { resetTestDb } from "../helpers/test-db";
import { signInAs, signOutUser } from "../helpers/session";
import { createBook, createConcept, createMilestone, createProject, createUser } from "../helpers/fixtures";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => import("../helpers/session"));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

let ada: { id: string };
let grace: { id: string };

beforeEach(async () => {
  resetTestDb(db);
  signOutUser();
  ada = await createUser(db, { username: "ada" });
  grace = await createUser(db, { username: "grace" });
});

describe("signed-out visitors", () => {
  it("can't save anything", async () => {
    const result = await saveMilestone(null, form({ title: "Graduated", type: "education", date: "2024-06-01" }));
    expect(result).toMatchObject({ success: false, error: "You need to be signed in to do that." });
    expect(await db.select().from(milestones)).toHaveLength(0);
  });
});

describe("milestones", () => {
  it("are saved to the signed-in user", async () => {
    signInAs(ada.id);
    const result = await saveMilestone(null, form({ title: "Graduated", type: "education", date: "2024-06-01" }));
    expect(result).toMatchObject({ success: true });
    const [row] = await db.select().from(milestones);
    expect(row).toMatchObject({ userId: ada.id, title: "Graduated", type: "education" });
  });

  it("reject a date that isn't a full date", async () => {
    signInAs(ada.id);
    const result = await saveMilestone(null, form({ title: "Graduated", type: "education", date: "June 2024" }));
    expect(result.success).toBe(false);
  });

  it("can't be edited by someone else", async () => {
    const milestone = await createMilestone(db, ada.id, { title: "Graduated" });
    signInAs(grace.id);
    const result = await saveMilestone(null, form({ id: milestone.id, title: "Hacked", type: "other", date: "2024-06-01" }));
    expect(result).toMatchObject({ success: false, error: "Milestone not found." });
    const [row] = await db.select().from(milestones).where(eq(milestones.id, milestone.id));
    expect(row.title).toBe("Graduated");
  });

  it("can't be deleted by someone else", async () => {
    const milestone = await createMilestone(db, ada.id, { title: "Graduated" });
    signInAs(grace.id);
    await deleteMilestone(milestone.id);
    expect(await db.select().from(milestones)).toHaveLength(1);
  });
});

describe("books", () => {
  it("can't be deleted by someone else", async () => {
    const book = await createBook(db, ada.id, { title: "SICP" });
    signInAs(grace.id);
    expect(await deleteBook(book.id)).toMatchObject({ success: false, error: "Book not found." });
    expect(await db.select().from(books)).toHaveLength(1);
  });

  it("can be deleted by their owner", async () => {
    const book = await createBook(db, ada.id, { title: "SICP" });
    signInAs(ada.id);
    expect(await deleteBook(book.id)).toMatchObject({ success: true });
    expect(await db.select().from(books)).toHaveLength(0);
  });
});

describe("projects", () => {
  it("only link to the owner's own concepts", async () => {
    const mine = await createConcept(db, ada.id, { name: "CQRS" });
    const theirs = await createConcept(db, grace.id, { name: "Compilers" });
    signInAs(ada.id);

    const result = await saveProject(null, form({ name: "Ledger", status: "idea", conceptIds: [mine.id, theirs.id] }));
    expect(result).toMatchObject({ success: true });

    const links = await db.select().from(conceptProjects);
    expect(links.map((l) => l.conceptId)).toEqual([mine.id]);
  });

  it("can't be edited by someone else", async () => {
    const project = await createProject(db, ada.id, { name: "Ledger" });
    signInAs(grace.id);
    const result = await saveProject(null, form({ id: project.id, name: "Mine now", status: "idea" }));
    expect(result).toMatchObject({ success: false, error: "Project not found." });
    const [row] = await db.select().from(projects).where(eq(projects.id, project.id));
    expect(row).toMatchObject({ name: "Ledger", userId: ada.id });
  });

  it("get a completed date when marked completed", async () => {
    signInAs(ada.id);
    await saveProject(null, form({ name: "Ledger", status: "completed" }));
    const [row] = await db.select().from(projects);
    expect(row.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
