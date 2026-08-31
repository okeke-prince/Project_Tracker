import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

const timestamps = {
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
};

export const books = sqliteTable('books', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  authors: text('authors').notNull(),
  year: integer('year'),
  status: text('status', { enum: ['want-to-read', 'reading', 'finished', 'reference'] }).notNull().default('want-to-read'),
  progress: integer('progress').default(0), // 0 to 100 percentage
  rating: integer('rating'),
  coverUrl: text('cover_url'),
  notes: text('notes'),
  tags: text('tags'),
  ...timestamps,
});

export const booksRelations = relations(books, ({ many }) => ({
  bookConcepts: many(bookConcepts),
  bookProjects: many(bookProjects),
}));

export const concepts = sqliteTable('concepts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shortDescription: text('short_description'),
  status: text('status', { enum: ['studied', 'applied', 'mastered'] }).notNull().default('studied'),
  notes: text('notes'),
  tags: text('tags'),
  ...timestamps,
});

export const conceptsRelations = relations(concepts, ({ many }) => ({
  bookConcepts: many(bookConcepts),
  conceptProjects: many(conceptProjects),
}));

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  status: text('status', { enum: ['idea', 'in-progress', 'completed', 'archived'] }).notNull().default('idea'),
  techStack: text('tech_stack'),
  lessonsLearned: text('lessons_learned'),
  tags: text('tags'),
  ...timestamps,
});

export const projectsRelations = relations(projects, ({ many }) => ({
  conceptProjects: many(conceptProjects),
  bookProjects: many(bookProjects),
}));

export const bookConcepts = sqliteTable('book_concepts', {
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  conceptId: text('concept_id').notNull().references(() => concepts.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookId, t.conceptId] }),
}));

export const bookConceptsRelations = relations(bookConcepts, ({ one }) => ({
  book: one(books, {
    fields: [bookConcepts.bookId],
    references: [books.id],
  }),
  concept: one(concepts, {
    fields: [bookConcepts.conceptId],
    references: [concepts.id],
  }),
}));

export const conceptProjects = sqliteTable('concept_projects', {
  conceptId: text('concept_id').notNull().references(() => concepts.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.conceptId, t.projectId] }),
}));

export const conceptProjectsRelations = relations(conceptProjects, ({ one }) => ({
  concept: one(concepts, {
    fields: [conceptProjects.conceptId],
    references: [concepts.id],
  }),
  project: one(projects, {
    fields: [conceptProjects.projectId],
    references: [projects.id],
  }),
}));

export const bookProjects = sqliteTable('book_projects', {
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookId, t.projectId] }),
}));

export const bookProjectsRelations = relations(bookProjects, ({ one }) => ({
  book: one(books, {
    fields: [bookProjects.bookId],
    references: [books.id],
  }),
  project: one(projects, {
    fields: [bookProjects.projectId],
    references: [projects.id],
  }),
}));

import type { AdapterAccountType } from "next-auth/adapters";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);
