import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { EpubReader } from "./epub-reader";
import { PdfReader } from "./pdf-reader";
import { auth } from "@/auth";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = await db.select().from(books).where(eq(books.id, id));
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
