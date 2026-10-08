import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

const timestamps = {
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
};

export const books = sqliteTable('books', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  authors: text('authors').notNull(),
  year: integer('year'),
  status: text('status', { enum: ['want-to-read', 'reading', 'finished', 'reference'] }).notNull().default('want-to-read'),
  progress: integer('progress').default(0), // 0 to 100 percentage
  rating: integer('rating'),
  coverUrl: text('cover_url'),
  fileUrl: text('file_url'),
  lastLocation: text('last_location'),
  finishedAt: text('finished_at'), // YYYY-MM-DD, shown on the public timeline
  notes: text('notes'), // private to the owner
  tags: text('tags'),
  ...timestamps,
});

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, { fields: [books.userId], references: [users.id] }),
  bookConcepts: many(bookConcepts),
  bookProjects: many(bookProjects),
}));

export const concepts = sqliteTable('concepts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  shortDescription: text('short_description'),
  status: text('status', { enum: ['studied', 'applied', 'mastered'] }).notNull().default('studied'),
  notes: text('notes'), // private to the owner
  tags: text('tags'),
  ...timestamps,
}, (t) => ({
  userSlug: uniqueIndex('concepts_user_slug_unique').on(t.userId, t.slug),
}));

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
  user: one(users, { fields: [concepts.userId], references: [users.id] }),
  bookConcepts: many(bookConcepts),
  conceptProjects: many(conceptProjects),
}));

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  status: text('status', { enum: ['idea', 'in-progress', 'completed', 'archived'] }).notNull().default('idea'),
  techStack: text('tech_stack'),
  lessonsLearned: text('lessons_learned'),
  completedAt: text('completed_at'), // YYYY-MM-DD, shown on the public timeline
  tags: text('tags'),
  ...timestamps,
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  conceptProjects: many(conceptProjects),
  bookProjects: many(bookProjects),
}));

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type', { enum: ['education', 'certification', 'work', 'award', 'other'] }).notNull().default('other'),
  date: text('date').notNull(), // YYYY-MM-DD
  description: text('description'),
  link: text('link'),
  ...timestamps,
});

export const milestonesRelations = relations(milestones, ({ one }) => ({
  user: one(users, { fields: [milestones.userId], references: [users.id] }),
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
  username: text("username").unique(), // public profile URL: /<username>
  headline: text("headline"),
  bio: text("bio"),
  cvUpdatedAt: integer("cv_updated_at", { mode: "timestamp_ms" }), // set while a CV is uploaded
  suspendedAt: integer("suspended_at", { mode: "timestamp_ms" }), // set by an admin; hides the profile and blocks sign-in
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

// Reports people send about a profile, reviewed on /admin.
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reportedUserId: text("reported_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }), // null for signed-out visitors
  reason: text("reason", { enum: ["impersonation", "copyright", "harassment", "spam", "other"] }).notNull(),
  details: text("details"),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
});
