import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { search } from "@/app/actions/search";
import { resetTestDb } from "../helpers/test-db";
import { signInAs, signOutUser } from "../helpers/session";
import { createBook, createConcept, createMilestone, createProject, createUser } from "../helpers/fixtures";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("../helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("@/lib/session", () => import("../helpers/session"));

let ada: { id: string };
let grace: { id: string };

beforeEach(async () => {
  resetTestDb(db);
  signOutUser();
  ada = await createUser(db, { username: "ada", name: "Ada Lovelace", headline: "Analytical engines" });
  grace = await createUser(db, { username: "grace", name: "Grace Hopper" });

  await createBook(db, ada.id, { title: "Designing Data-Intensive Applications", authors: "Martin Kleppmann" });
  await createConcept(db, ada.id, { name: "Event sourcing", shortDescription: "Store changes as events" });
  await createProject(db, ada.id, { name: "Ledger service", description: "Event-sourced payments" });
  await createMilestone(db, ada.id, { title: "AWS Solutions Architect" });

  await createBook(db, grace.id, { title: "Designing Distributed Systems", authors: "Brendan Burns" });
});

const titles = (results: Awaited<ReturnType<typeof search>>) => results.map((r) => `${r.type}:${r.title}`);

describe("search", () => {
  it("ignores queries shorter than two characters", async () => {
    signInAs(ada.id);
    expect(await search("")).toEqual([]);
    expect(await search(" d ")).toEqual([]);
  });

  it("only finds people for visitors", async () => {
    expect(titles(await search("design"))).toEqual([]);
    expect(titles(await search("ada"))).toEqual(["person:Ada Lovelace"]);
  });

  it("finds the signed-in user's own books, concepts, projects and milestones", async () => {
    signInAs(ada.id);
    expect(titles(await search("design"))).toEqual(["book:Designing Data-Intensive Applications"]);
    expect(titles(await search("event"))).toEqual(["concept:Event sourcing", "project:Ledger service"]);
    expect(titles(await search("aws"))).toEqual(["milestone:AWS Solutions Architect"]);
  });

  it("never shows another user's private items", async () => {
    signInAs(grace.id);
    expect(titles(await search("design"))).toEqual(["book:Designing Distributed Systems"]);
    expect(titles(await search("event"))).toEqual([]);
  });

  it("is case-insensitive and matches authors and usernames", async () => {
    signInAs(ada.id);
    expect(titles(await search("KLEPPMANN"))).toEqual(["book:Designing Data-Intensive Applications"]);
    expect(titles(await search("GRACE"))).toEqual(["person:Grace Hopper"]);
  });

  it("treats % and _ as plain characters", async () => {
    signInAs(ada.id);
    expect(await search("%%")).toEqual([]);
    expect(await search("__")).toEqual([]);
  });

  it("links each result to the right page", async () => {
    signInAs(ada.id);
    const [book] = await search("kleppmann");
    expect(book.href).toBe(`/books/${book.id}`);
    const [person] = await search("grace");
    expect(person.href).toBe("/grace");
  });
});
