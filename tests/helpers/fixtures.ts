import { books, concepts, milestones, projects, users } from "@/db/schema";
import type { TestDb } from "./test-db";

// Small builders for test data. Each returns the inserted row.

export async function createUser(db: TestDb, values: { username: string; name?: string; headline?: string }) {
  const [row] = await db
    .insert(users)
    .values({ name: values.name ?? values.username, username: values.username, email: `${values.username}@example.test`, headline: values.headline })
    .returning();
  return row;
}

export async function createBook(db: TestDb, userId: string, values: { title: string; authors?: string; fileUrl?: string }) {
  const [row] = await db.insert(books).values({ userId, title: values.title, authors: values.authors ?? "Someone", fileUrl: values.fileUrl }).returning();
  return row;
}

export async function createConcept(db: TestDb, userId: string, values: { name: string; shortDescription?: string }) {
  const slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const [row] = await db.insert(concepts).values({ userId, name: values.name, slug, shortDescription: values.shortDescription }).returning();
  return row;
}

export async function createProject(db: TestDb, userId: string, values: { name: string; description?: string }) {
  const [row] = await db.insert(projects).values({ userId, name: values.name, description: values.description }).returning();
  return row;
}

export async function createMilestone(db: TestDb, userId: string, values: { title: string; date?: string }) {
  const [row] = await db.insert(milestones).values({ userId, title: values.title, date: values.date ?? "2024-06-01" }).returning();
  return row;
}
