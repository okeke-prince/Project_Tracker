import { db } from "./index";
import { books, concepts, projects } from "./schema";
import { count, eq, desc, inArray } from "drizzle-orm";

export async function getDashboardMetrics() {
  const booksFinished = await db.select({ count: count() }).from(books).where(eq(books.status, 'finished'));
  const conceptsMastered = await db.select({ count: count() }).from(concepts).where(eq(concepts.status, 'mastered'));
  const projectsCompleted = await db.select({ count: count() }).from(projects).where(eq(projects.status, 'completed'));
  
  const totalConcepts = await db.select({ count: count() }).from(concepts);
  const masteredOrApplied = await db.select({ count: count() }).from(concepts).where(inArray(concepts.status, ['mastered', 'applied']));

  return {
    booksFinished: booksFinished[0].count,
    conceptsMastered: conceptsMastered[0].count,
    projectsCompleted: projectsCompleted[0].count,
    totalConcepts: totalConcepts[0].count,
    masteredOrAppliedConcepts: masteredOrApplied[0].count,
  };
}

export async function getInProgressItems() {
  const readingBooks = await db.select().from(books).where(eq(books.status, 'reading')).orderBy(desc(books.updatedAt)).limit(3);
  const activeConcepts = await db.select().from(concepts).where(inArray(concepts.status, ['studied', 'applied'])).orderBy(desc(concepts.updatedAt)).limit(4);
  const activeProjects = await db.select().from(projects).where(eq(projects.status, 'in-progress')).orderBy(desc(projects.updatedAt)).limit(3);

  return {
    books: readingBooks,
    concepts: activeConcepts,
    projects: activeProjects,
  };
}

export async function getRecentActivity() {
  const recentBooks = await db.select().from(books).orderBy(desc(books.updatedAt)).limit(5);
  const recentConcepts = await db.select().from(concepts).orderBy(desc(concepts.updatedAt)).limit(5);
  const recentProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt)).limit(5);

  const combined = [
    ...recentBooks.map(b => ({ type: 'book' as const, id: b.id, title: b.title, date: b.updatedAt, status: b.status })),
    ...recentConcepts.map(c => ({ type: 'concept' as const, id: c.id, title: c.name, date: c.updatedAt, status: c.status })),
    ...recentProjects.map(p => ({ type: 'project' as const, id: p.id, title: p.name, date: p.updatedAt, status: p.status })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return combined;
}

export async function getMasterySnapshot() {
  const studied = await db.select({ count: count() }).from(concepts).where(eq(concepts.status, 'studied'));
  const applied = await db.select({ count: count() }).from(concepts).where(eq(concepts.status, 'applied'));
  const mastered = await db.select({ count: count() }).from(concepts).where(eq(concepts.status, 'mastered'));

  return {
    studied: studied[0].count,
    applied: applied[0].count,
    mastered: mastered[0].count,
    total: studied[0].count + applied[0].count + mastered[0].count,
  };
}

export async function getRecentlyMastered() {
  const masteredConcepts = await db.select().from(concepts).where(eq(concepts.status, 'mastered')).orderBy(desc(concepts.updatedAt)).limit(3);
  const finishedBooks = await db.select().from(books).where(eq(books.status, 'finished')).orderBy(desc(books.updatedAt)).limit(3);

  const combined = [
    ...masteredConcepts.map(c => ({ type: 'concept' as const, id: c.id, title: c.name, description: c.shortDescription, date: c.updatedAt })),
    ...finishedBooks.map(b => ({ type: 'book' as const, id: b.id, title: b.title, description: b.authors, date: b.updatedAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  return combined;
}
