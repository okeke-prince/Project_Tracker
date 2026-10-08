import { db } from "@/db";
import { books } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { localFilePath } from "@/lib/storage";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  // Book files are only ever served to their owner. Anyone else gets a 404.
  const result = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, userId)));
  const book = result[0];

  if (!book || !book.fileUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fileUrl = book.fileUrl;
  const isPdf = fileUrl.includes(".pdf");
  const isEpub = fileUrl.includes(".epub");
  const contentType = isPdf
    ? "application/pdf"
    : isEpub
      ? "application/epub+zip"
      : "application/octet-stream";

  try {
    let fileBuffer: Buffer;

    if (fileUrl.startsWith("s3://")) {
      // Internal s3:// URI
      const key = fileUrl.replace("s3://", "");
      const s3Client = new S3Client({
        region: process.env.S3_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      });
      const response = await s3Client.send(command);
      if (response.Body?.transformToByteArray) {
        const bytes = await response.Body.transformToByteArray();
        fileBuffer = Buffer.from(bytes);
      } else {
        return NextResponse.json({ error: "Cannot read S3 response" }, { status: 500 });
      }
    } else if (fileUrl.includes(".amazonaws.com/")) {
      // Old-format S3 URL
      const urlObj = new URL(fileUrl);
      const key = urlObj.pathname.slice(1);
      const s3Client = new S3Client({
        region: process.env.S3_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      });
      const response = await s3Client.send(command);
      if (response.Body?.transformToByteArray) {
        const bytes = await response.Body.transformToByteArray();
        fileBuffer = Buffer.from(bytes);
      } else {
        return NextResponse.json({ error: "Cannot read S3 response" }, { status: 500 });
      }
    } else {
      // Local file
      const localPath = localFilePath(fileUrl);
      fileBuffer = await fs.readFile(localPath);
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${book.title}.${isPdf ? "pdf" : "epub"}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("File proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}
