"use server"

import { db } from "@/db";
import { books } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getActionUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function syncBookProgress(bookId: string, percentage: number, locationCfi: string) {
  try {
    // Only update status to reading if it was want-to-read, and finished if 100%
    const userId = await getActionUserId();
    const result = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
    const currentBook = result[0];
    
    if (!currentBook) return { success: false, error: "Book not found" };

    let newStatus = currentBook.status;
    if (percentage > 0 && currentBook.status === 'want-to-read') newStatus = 'reading';
    if (percentage === 100) newStatus = 'finished';
    const finishedAt = newStatus === 'finished'
      ? (currentBook.finishedAt || new Date().toISOString().slice(0, 10))
      : currentBook.finishedAt;

    await db.update(books).set({
      finishedAt,
      progress: Math.round(percentage),
      lastLocation: locationCfi,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }).where(eq(books.id, bookId));

    // We don't revalidate aggressively here to prevent UI jitter while reading,
    // but we can revalidate the specific book page.
    revalidatePath(`/books/${bookId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to sync progress:", error);
    return { success: false, error: "Failed to sync" };
  }
}
