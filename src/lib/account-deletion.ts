import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bookConcepts, bookProjects, books, conceptProjects, concepts, milestones, projects, reports, sessions, users } from "@/db/schema";
import { deleteAvatar, deleteBookFile, deleteCv } from "@/lib/storage";

/**
 * Permanently deletes a user: their uploaded files, avatar and CV, every book, concept,
 * project and milestone, reports about them, and the account itself.
 */
export async function deleteUserAndData(userId: string) {
  // Files first, so nothing is left behind in storage once the rows are gone.
  const userBooks = await db.select({ id: books.id, fileUrl: books.fileUrl }).from(books).where(eq(books.userId, userId));
  for (const book of userBooks) {
    if (book.fileUrl) await deleteBookFile(book.fileUrl).catch((err) => console.warn("Could not delete book file:", err));
  }
  await deleteAvatar(userId).catch((err) => console.warn("Could not delete avatar:", err));
  await deleteCv(userId).catch((err) => console.warn("Could not delete CV:", err));

  const bookIds = userBooks.map((b) => b.id);
  const conceptIds = (await db.select({ id: concepts.id }).from(concepts).where(eq(concepts.userId, userId))).map((c) => c.id);
  const projectIds = (await db.select({ id: projects.id }).from(projects).where(eq(projects.userId, userId))).map((p) => p.id);
  const none = ["__none__"]; // inArray needs at least one value

  // SQLite foreign keys aren't switched on for this connection, so remove the links explicitly.
  db.transaction((tx) => {
    tx.delete(bookConcepts).where(or(inArray(bookConcepts.bookId, bookIds.length ? bookIds : none), inArray(bookConcepts.conceptId, conceptIds.length ? conceptIds : none))).run();
    tx.delete(conceptProjects).where(or(inArray(conceptProjects.conceptId, conceptIds.length ? conceptIds : none), inArray(conceptProjects.projectId, projectIds.length ? projectIds : none))).run();
    tx.delete(bookProjects).where(or(inArray(bookProjects.bookId, bookIds.length ? bookIds : none), inArray(bookProjects.projectId, projectIds.length ? projectIds : none))).run();
    tx.delete(milestones).where(eq(milestones.userId, userId)).run();
    tx.delete(books).where(eq(books.userId, userId)).run();
    tx.delete(concepts).where(eq(concepts.userId, userId)).run();
    tx.delete(projects).where(eq(projects.userId, userId)).run();
    tx.delete(reports).where(eq(reports.reportedUserId, userId)).run();
    tx.update(reports).set({ reporterId: null }).where(eq(reports.reporterId, userId)).run();
    tx.delete(accounts).where(eq(accounts.userId, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
    tx.delete(users).where(eq(users.id, userId)).run();
  });
}
