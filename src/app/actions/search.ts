"use server";

import { and, eq, isNotNull, isNull, or, sql, type SQL, type AnyColumn } from "drizzle-orm";
import { db } from "@/db";
import { books, concepts, milestones, projects, users } from "@/db/schema";
import { getCurrentUserId } from "@/lib/session";

export type SearchResult = {
  id: string;
  type: "book" | "concept" | "project" | "milestone" | "person";
  title: string;
  subtitle: string | null;
  href: string;
  image?: string | null;
};

const PER_GROUP = 5;

// Case-insensitive "contains" match. % and _ in the query are matched literally.
function contains(column: AnyColumn, query: string): SQL {
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return sql`${column} LIKE ${pattern} ESCAPE '\\'`;
}

/**
 * Searches the signed-in user's own books, concepts, projects and milestones, plus everyone's
 * public profiles. Visitors only get profiles.
 */
export async function search(raw: string): Promise<SearchResult[]> {
  const query = raw.trim().slice(0, 100);
  if (query.length < 2) return [];

  const userId = await getCurrentUserId();

  const people = db
    .select({ id: users.id, name: users.name, username: users.username, image: users.image, headline: users.headline })
    .from(users)
    .where(and(isNotNull(users.username), isNull(users.suspendedAt), or(contains(users.username, query), contains(users.name, query))))
    .limit(PER_GROUP)
    .then((rows) =>
      rows.map((u): SearchResult => ({
        id: u.id,
        type: "person",
        title: u.name || u.username!,
        subtitle: u.headline || `@${u.username}`,
        href: `/${u.username}`,
        image: u.image,
      })),
    );

  if (!userId) return people;

  const [bookRows, conceptRows, projectRows, milestoneRows, personRows] = await Promise.all([
    db
      .select({ id: books.id, title: books.title, authors: books.authors })
      .from(books)
      .where(and(eq(books.userId, userId), or(contains(books.title, query), contains(books.authors, query))))
      .limit(PER_GROUP),
    db
      .select({ id: concepts.id, name: concepts.name, shortDescription: concepts.shortDescription })
      .from(concepts)
      .where(and(eq(concepts.userId, userId), or(contains(concepts.name, query), contains(concepts.shortDescription, query))))
      .limit(PER_GROUP),
    db
      .select({ id: projects.id, name: projects.name, description: projects.description })
      .from(projects)
      .where(and(eq(projects.userId, userId), or(contains(projects.name, query), contains(projects.description, query), contains(projects.techStack, query))))
      .limit(PER_GROUP),
    db
      .select({ id: milestones.id, title: milestones.title, date: milestones.date })
      .from(milestones)
      .where(and(eq(milestones.userId, userId), or(contains(milestones.title, query), contains(milestones.description, query))))
      .limit(PER_GROUP),
    people,
  ]);

  return [
    ...bookRows.map((b): SearchResult => ({ id: b.id, type: "book", title: b.title, subtitle: b.authors, href: `/books/${b.id}` })),
    ...conceptRows.map((c): SearchResult => ({ id: c.id, type: "concept", title: c.name, subtitle: c.shortDescription, href: `/concepts/${c.id}` })),
    ...projectRows.map((p): SearchResult => ({ id: p.id, type: "project", title: p.name, subtitle: p.description, href: `/projects/${p.id}` })),
    ...milestoneRows.map((m): SearchResult => ({ id: m.id, type: "milestone", title: m.title, subtitle: m.date, href: "/manage?tab=milestones" })),
    ...personRows,
  ];
}
