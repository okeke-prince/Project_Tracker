import { db } from './index';
import { books, concepts, projects, bookConcepts, conceptProjects, users } from './schema';
import { sql, eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  // Sample data belongs to one account: SEED_EMAIL=you@example.com npx tsx src/db/seed.ts
  const email = process.env.SEED_EMAIL;
  if (!email) throw new Error('Set SEED_EMAIL to the account that should own the sample data.');
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) throw new Error(`No user with email ${email}. Register first.`);
  const userId = user.id;

  // Clear that user's existing data (links cascade)
  db.delete(books).where(eq(books.userId, userId)).run();
  db.delete(concepts).where(eq(concepts.userId, userId)).run();
  db.delete(projects).where(eq(projects.userId, userId)).run();

  // Seed Concepts
  const ddd = db.insert(concepts).values({
    userId,
    name: 'Domain-Driven Design',
    slug: 'domain-driven-design',
    shortDescription: 'An approach to software development that centers the development on programming a domain model that has a rich understanding of the processes and rules of a domain.',
    status: 'mastered',
    tags: JSON.stringify(['architecture', 'modeling']),
  }).returning().get();

  const cqrs = db.insert(concepts).values({
    userId,
    name: 'CQRS',
    slug: 'cqrs',
    shortDescription: 'Command Query Responsibility Segregation. Separates read and update operations for a data store.',
    status: 'applied',
    tags: JSON.stringify(['architecture', 'patterns']),
  }).returning().get();

  const eventSourcing = db.insert(concepts).values({
    userId,
    name: 'Event Sourcing',
    slug: 'event-sourcing',
    shortDescription: 'Capture all changes to an application state as a sequence of events.',
    status: 'studied',
    tags: JSON.stringify(['architecture', 'data']),
  }).returning().get();

  const microservices = db.insert(concepts).values({
    userId,
    name: 'Microservices',
    slug: 'microservices',
    shortDescription: 'An architectural style that structures an application as a collection of loosely coupled services.',
    status: 'mastered',
    tags: JSON.stringify(['architecture', 'distributed']),
  }).returning().get();

  // Seed Books
  const dddBook = db.insert(books).values({
    userId,
    title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
    authors: 'Eric Evans',
    year: 2003,
    status: 'finished',
    rating: 5,
    tags: JSON.stringify(['architecture', 'classic']),
  }).returning().get();

  const dataIntensive = db.insert(books).values({
    userId,
    title: 'Designing Data-Intensive Applications',
    authors: 'Martin Kleppmann',
    year: 2017,
    status: 'reference',
    rating: 5,
    tags: JSON.stringify(['data', 'distributed-systems']),
  }).returning().get();

  const cleanArch = db.insert(books).values({
    userId,
    title: 'Clean Architecture',
    authors: 'Robert C. Martin',
    year: 2017,
    status: 'finished',
    rating: 4,
    tags: JSON.stringify(['architecture', 'clean-code']),
  }).returning().get();

  const buildingMicroservices = db.insert(books).values({
    userId,
    title: 'Building Microservices',
    authors: 'Sam Newman',
    year: 2021,
    status: 'reading',
    tags: JSON.stringify(['architecture', 'microservices']),
  }).returning().get();

  // Seed Projects
  const orderSystem = db.insert(projects).values({
    userId,
    name: 'Distributed Order Management System',
    description: 'A mock project to implement saga patterns and event sourcing.',
    status: 'completed',
    techStack: JSON.stringify(['Go', 'Kafka', 'PostgreSQL']),
    tags: JSON.stringify(['distributed', 'saga']),
  }).returning().get();

  const personalBlog = db.insert(projects).values({
    userId,
    name: 'Personal Dev Blog',
    description: 'Static site using Next.js and MDX.',
    status: 'in-progress',
    techStack: JSON.stringify(['Next.js', 'React', 'Tailwind']),
    tags: JSON.stringify(['frontend', 'web']),
  }).returning().get();

  // Link Concepts to Books
  db.insert(bookConcepts).values({ bookId: dddBook.id, conceptId: ddd.id }).run();
  db.insert(bookConcepts).values({ bookId: dataIntensive.id, conceptId: eventSourcing.id }).run();
  db.insert(bookConcepts).values({ bookId: cleanArch.id, conceptId: microservices.id }).run();
  db.insert(bookConcepts).values({ bookId: buildingMicroservices.id, conceptId: microservices.id }).run();

  // Link Concepts to Projects
  db.insert(conceptProjects).values({ projectId: orderSystem.id, conceptId: cqrs.id }).run();
  db.insert(conceptProjects).values({ projectId: orderSystem.id, conceptId: eventSourcing.id }).run();
  db.insert(conceptProjects).values({ projectId: orderSystem.id, conceptId: microservices.id }).run();

  console.log('Seeding complete!');
}

seed().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
