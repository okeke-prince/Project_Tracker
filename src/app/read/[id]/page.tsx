import { db } from "@/db";
import { books } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { EpubReader } from "./epub-reader";
import { PdfReader } from "./pdf-reader";
import { auth } from "@/auth";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  // Only the owner can read a book's file.
  const result = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, userId)));
  const book = result[0];

  const fileUrl = book?.fileUrl;

  if (!book || !fileUrl) {
    notFound();
  }

  // Use the proxy API route — avoids S3 CORS issues
  const proxyUrl = `/api/file/${book.id}`;

  const isEpub = fileUrl.includes(".epub");
  const isPdf = fileUrl.includes(".pdf");

  if (!isEpub && !isPdf) {
    notFound();
  }

  // Parse the stored lastLocation for PDFs (stored as "page:N")
  let initialPage = 1;
  if (isPdf && book.lastLocation?.startsWith("page:")) {
    initialPage = parseInt(book.lastLocation.replace("page:", ""), 10) || 1;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {isEpub ? (
        <EpubReader
          bookId={book.id}
          fileUrl={proxyUrl}
          title={book.title}
          initialLocation={book.lastLocation}
        />
      ) : (
        <PdfReader
          bookId={book.id}
          fileUrl={proxyUrl}
          title={book.title}
          initialPage={initialPage}
        />
      )}
    </div>
  );
}
