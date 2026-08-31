"use server"

import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function syncBookProgress(bookId: string, percentage: number, locationCfi: string) {
  try {
    // Only update status to reading if it was want-to-read, and finished if 100%
    const result = await db.select().from(books).where(eq(books.id, bookId));
    const currentBook = result[0];
    
    if (!currentBook) return { success: false, error: "Book not found" };

    let newStatus = currentBook.status;
    if (percentage > 0 && currentBook.status === 'want-to-read') newStatus = 'reading';
    if (percentage === 100) newStatus = 'finished';

    await db.update(books).set({
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
