import { db } from "./index";
import { books, concepts, projects, milestones, users, conceptProjects, bookConcepts, bookProjects } from "./schema";
import { and, count, eq, desc, inArray, isNotNull, sql } from "drizzle-orm";

export async function getDashboardMetrics(userId: string) {
  const booksFinished = await db.select({ count: count() }).from(books).where(and(eq(books.userId, userId), eq(books.status, 'finished')));
  const conceptsMastered = await db.select({ count: count() }).from(concepts).where(and(eq(concepts.userId, userId), eq(concepts.status, 'mastered')));
  const projectsCompleted = await db.select({ count: count() }).from(projects).where(and(eq(projects.userId, userId), eq(projects.status, 'completed')));
  
  const totalConcepts = await db.select({ count: count() }).from(concepts).where(eq(concepts.userId, userId));
  const masteredOrApplied = await db.select({ count: count() }).from(concepts).where(and(eq(concepts.userId, userId), inArray(concepts.status, ['mastered', 'applied'])));

  return {
    booksFinished: booksFinished[0].count,
    conceptsMastered: conceptsMastered[0].count,
    projectsCompleted: projectsCompleted[0].count,
    totalConcepts: totalConcepts[0].count,
    masteredOrAppliedConcepts: masteredOrApplied[0].count,
  };
}

export async function getInProgressItems(userId: string) {
  const readingBooks = await db.select().from(books).where(and(eq(books.userId, userId), eq(books.status, 'reading'))).orderBy(desc(books.updatedAt)).limit(3);
  const activeConcepts = await db.select().from(concepts).where(and(eq(concepts.userId, userId), inArray(concepts.status, ['studied', 'applied']))).orderBy(desc(concepts.updatedAt)).limit(4);
  const activeProjects = await db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.status, 'in-progress'))).orderBy(desc(projects.updatedAt)).limit(3);

  return {
    books: readingBooks,
    concepts: activeConcepts,
    projects: activeProjects,
  };
}

export async function getMasterySnapshot(userId: string) {
  const studied = await db.select({ count: count() }).from(concepts).where(and(eq(concepts.userId, userId), eq(concepts.status, 'studied')));
  const applied = await db.select({ count: count() }).from(concepts).where(and(eq(concepts.userId, userId), eq(concepts.status, 'applied')));
  const mastered = await db.select({ count: count() }).from(concepts).where(and(eq(concepts.userId, userId), eq(concepts.status, 'mastered')));

  return {
    studied: studied[0].count,
    applied: applied[0].count,
    mastered: mastered[0].count,
    total: studied[0].count + applied[0].count + mastered[0].count,
  };
}

export async function getRecentlyMastered(userId: string) {
  const masteredConcepts = await db.select().from(concepts).where(and(eq(concepts.userId, userId), eq(concepts.status, 'mastered'))).orderBy(desc(concepts.updatedAt)).limit(3);
  const finishedBooks = await db.select().from(books).where(and(eq(books.userId, userId), eq(books.status, 'finished'))).orderBy(desc(books.updatedAt)).limit(3);

  const combined = [
    ...masteredConcepts.map(c => ({ type: 'concept' as const, id: c.id, title: c.name, description: c.shortDescription, date: c.updatedAt })),
    ...finishedBooks.map(b => ({ type: 'book' as const, id: b.id, title: b.title, description: b.authors, date: b.finishedAt || b.updatedAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  return combined;
}

// ---------------------------------------------------------------------------
// Public profile
// ---------------------------------------------------------------------------

export type TimelineEvent = {
  key: string;
  kind: 'milestone' | 'book' | 'project-started' | 'project-completed';
  date: string; // YYYY-MM-DD or ISO timestamp
  title: string;
  subtitle?: string | null;
  description?: string | null;
  href?: string;
  link?: string | null;
  repoUrl?: string | null;
  milestoneType?: typeof milestones.$inferSelect['type'];
  concepts?: { id: string; name: string }[];
};

export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
    columns: { id: true, name: true, username: true, image: true, headline: true, bio: true },
  });
}

/** What the navbar needs. Read from the DB because the session token keeps the picture from sign-in time. */
export async function getNavUser(userId: string) {
  return db.query.users.findFirst({ where: eq(users.id, userId), columns: { username: true, image: true, name: true } });
}

export async function getUsername(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { username: true } });
  return user?.username ?? null;
}

/**
 * Everything someone has been up to, newest first. Dates are when things happened
 * (milestone date, book finished, project started/completed), not when rows were edited.
 */
export async function getTimeline(userId: string): Promise<TimelineEvent[]> {
  const userMilestones = await db.select().from(milestones).where(eq(milestones.userId, userId));
  const finishedBooks = await db.select().from(books).where(and(eq(books.userId, userId), eq(books.status, 'finished')));
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    with: { conceptProjects: { with: { concept: true } } },
  });

  const events: TimelineEvent[] = [
    ...userMilestones.map((m) => ({
      key: `milestone-${m.id}`,
      kind: 'milestone' as const,
      date: m.date,
      title: m.title,
      description: m.description,
      link: m.link,
      milestoneType: m.type,
    })),
    ...finishedBooks.map((b) => ({
      key: `book-${b.id}`,
      kind: 'book' as const,
      date: b.finishedAt || b.updatedAt,
      title: `Finished reading ${b.title}`,
      subtitle: b.authors,
      href: `/books/${b.id}`,
    })),
  ];

  for (const p of userProjects) {
    if (p.status === 'idea') continue;
    const applied = p.conceptProjects.map((cp) => ({ id: cp.concept.id, name: cp.concept.name }));
    events.push({
      key: `project-started-${p.id}`,
      kind: 'project-started',
      date: p.createdAt,
      title: `Started ${p.name}`,
      description: p.description,
      href: `/projects/${p.id}`,
      repoUrl: p.repoUrl,
      concepts: p.status === 'completed' ? undefined : applied,
    });
    if (p.status === 'completed') {
      events.push({
        key: `project-completed-${p.id}`,
        kind: 'project-completed',
        date: p.completedAt || p.updatedAt,
        title: `Shipped ${p.name}`,
        description: p.description,
        href: `/projects/${p.id}`,
        repoUrl: p.repoUrl,
        concepts: applied,
      });
    }
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Public data for a profile page. Private fields (notes, files, reading position) are left out. */
export async function getPublicLibrary(userId: string) {
  const publicBooks = await db
    .select({
      id: books.id, title: books.title, authors: books.authors, year: books.year, status: books.status,
      rating: books.rating, coverUrl: books.coverUrl, tags: books.tags, finishedAt: books.finishedAt,
    })
    .from(books)
    .where(eq(books.userId, userId))
    .orderBy(desc(books.updatedAt));

  const publicConcepts = await db
    .select({
      id: concepts.id, name: concepts.name, shortDescription: concepts.shortDescription,
      status: concepts.status, tags: concepts.tags,
    })
    .from(concepts)
    .where(eq(concepts.userId, userId))
    .orderBy(concepts.name);

  const publicProjects = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));

  return { books: publicBooks, concepts: publicConcepts, projects: publicProjects };
}

export async function countAppliedConcepts(userId: string) {
  const rows = await db
    .selectDistinct({ id: conceptProjects.conceptId })
    .from(conceptProjects)
    .innerJoin(concepts, eq(concepts.id, conceptProjects.conceptId))
    .where(eq(concepts.userId, userId));
  return rows.length;
}

export async function getOwner(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, username: true },
  });
}

/** The most active public profiles, for the landing page. */
export async function getFeaturedProfiles(limit = 6) {
  const bookCount = sql<number>`(select count(*) from ${books} where ${books.userId} = ${users.id} and ${books.status} = 'finished')`;
  const projectCount = sql<number>`(select count(*) from ${projects} where ${projects.userId} = ${users.id})`;
  const conceptCount = sql<number>`(select count(*) from ${concepts} where ${concepts.userId} = ${users.id})`;
  const milestoneCount = sql<number>`(select count(*) from ${milestones} where ${milestones.userId} = ${users.id})`;

  const rows = await db
    .select({
      username: users.username,
      name: users.name,
      image: users.image,
      headline: users.headline,
      books: bookCount,
      projects: projectCount,
      concepts: conceptCount,
      milestones: milestoneCount,
    })
    .from(users)
    .where(isNotNull(users.username))
    .orderBy(desc(sql`${bookCount} + ${projectCount} + ${conceptCount} + ${milestoneCount}`))
    .limit(limit);

  // Only show people who have actually added something.
  return rows.filter((r) => r.books + r.projects + r.concepts + r.milestones > 0) as (typeof rows[number] & { username: string })[];
}

export type GraphNode = { id: string; name: string; type: 'concept' | 'book' | 'project'; status: string; href: string };
export type GraphLink = { source: string; target: string };

/**
 * One user's knowledge graph: concepts, books and projects as nodes, and the links
 * between them as edges. Books and projects only appear once they're linked to something.
 */
export async function getKnowledgeGraph(userId: string): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const userConcepts = await db.select().from(concepts).where(eq(concepts.userId, userId));
  const userBooks = await db.select().from(books).where(eq(books.userId, userId));
  const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));

  const bookIds = userBooks.map((b) => b.id);
  const conceptIds = userConcepts.map((c) => c.id);
  const projectIds = userProjects.map((p) => p.id);

  const bc = bookIds.length ? await db.select().from(bookConcepts).where(inArray(bookConcepts.bookId, bookIds)) : [];
  const cp = conceptIds.length ? await db.select().from(conceptProjects).where(inArray(conceptProjects.conceptId, conceptIds)) : [];
  const bp = projectIds.length ? await db.select().from(bookProjects).where(inArray(bookProjects.projectId, projectIds)) : [];

  const links: GraphLink[] = [
    ...bc.map((l) => ({ source: `book:${l.bookId}`, target: `concept:${l.conceptId}` })),
    ...cp.map((l) => ({ source: `concept:${l.conceptId}`, target: `project:${l.projectId}` })),
    ...bp.map((l) => ({ source: `book:${l.bookId}`, target: `project:${l.projectId}` })),
  ];
  const linked = new Set(links.flatMap((l) => [l.source, l.target]));

  const nodes: GraphNode[] = [
    ...userConcepts.map((c) => ({ id: `concept:${c.id}`, name: c.name, type: 'concept' as const, status: c.status, href: `/concepts/${c.id}` })),
    ...userBooks.filter((b) => linked.has(`book:${b.id}`))
      .map((b) => ({ id: `book:${b.id}`, name: b.title, type: 'book' as const, status: b.status, href: `/books/${b.id}` })),
    ...userProjects.filter((p) => linked.has(`project:${p.id}`))
      .map((p) => ({ id: `project:${p.id}`, name: p.name, type: 'project' as const, status: p.status, href: `/projects/${p.id}` })),
  ];

  return { nodes, links };
}
