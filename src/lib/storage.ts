import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function isS3Configured() {
  return !!(
    process.env.S3_BUCKET_NAME &&
    process.env.S3_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function uploadBookFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create a unique filename to prevent collisions
  const fileExt = path.extname(file.name);
  const baseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9-]/g, "-");
  const uniqueFilename = `${baseName}-${crypto.randomUUID()}${fileExt}`;

  if (isS3Configured()) {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `books/${uniqueFilename}`,
      Body: buffer,
      ContentType: file.type,
    });

    await getS3Client().send(command);

    // Store the S3 key in the DB (not a public URL, since the bucket is private)
    return `s3://books/${uniqueFilename}`;
  } else {
    // Local Fallback Strategy
    const publicUploadDir = path.join(process.cwd(), "public", "uploads", "books");
    await fs.mkdir(publicUploadDir, { recursive: true });
    const filePath = path.join(publicUploadDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);
    return `/uploads/books/${uniqueFilename}`;
  }
}

/**
 * Deletes a book file from S3 or local storage given the stored fileUrl.
 */
export async function deleteBookFile(fileUrl: string): Promise<void> {
  if (fileUrl.startsWith("s3://")) {
    // Extract the S3 key from our internal s3:// URI
    const key = fileUrl.replace("s3://", "");
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });
    await getS3Client().send(command);
  } else if (fileUrl.includes(".amazonaws.com/") && isS3Configured()) {
    // Handle old-format S3 URLs
    const urlObj = new URL(fileUrl);
    const key = urlObj.pathname.slice(1);
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });
    await getS3Client().send(command);
  } else {
    // Local file — derive absolute path from relative URL
    const localPath = path.join(process.cwd(), "public", fileUrl);
    await fs.unlink(localPath).catch(() => {
      // Ignore if file not found
    });
  }
}

/**
 * Resolves a stored fileUrl to a browser-accessible URL.
 * For S3 files, generates a presigned URL valid for 1 hour.
 * For local files, returns the path as-is.
 */
export async function resolveFileUrl(fileUrl: string): Promise<string> {
  if (fileUrl.startsWith("s3://")) {
    const key = fileUrl.replace("s3://", "");
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });
    // Presigned URL valid for 1 hour
    return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
  }

  // Handle old-format S3 URLs (https://bucket.s3.region.amazonaws.com/key)
  if (fileUrl.includes(".amazonaws.com/") && isS3Configured()) {
    const urlObj = new URL(fileUrl);
    const key = urlObj.pathname.slice(1); // Remove leading /
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });
    return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
  }

  // Local file, return as-is
  return fileUrl;
}
