import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await db.select().from(books).where(eq(books.id, id));
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
      const stream = response.Body as ReadableStream;
      const chunks: Uint8Array[] = [];
      const reader = stream.transformToByteArray
        ? undefined
        : (stream as any).getReader?.();

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
      const localPath = path.join(process.cwd(), "public", fileUrl);
      fileBuffer = await fs.readFile(localPath);
    }

    return new NextResponse(fileBuffer, {
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
