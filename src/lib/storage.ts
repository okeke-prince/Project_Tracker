import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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

/**
 * Where a locally stored book file lives on disk. New uploads go to ./storage, outside
 * public/, so the only way to fetch them is the owner-checked /api/file route.
 * Older uploads under public/uploads are still found.
 */
export function localFilePath(fileUrl: string): string {
  if (fileUrl.startsWith("local://")) {
    const key = fileUrl.replace("local://", "");
    return path.join(process.cwd(), "storage", path.dirname(key), path.basename(key));
  }
  return path.join(process.cwd(), "public", fileUrl);
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
    // Local Fallback Strategy (private folder, served only through /api/file)
    const fileUrl = `local://books/${uniqueFilename}`;
    const filePath = localFilePath(fileUrl);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return fileUrl;
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
    // Local file
    const localPath = localFilePath(fileUrl);
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

// ---------------------------------------------------------------------------
// Profile pictures. Unlike book files these are public, served by /api/avatar/<userId>.
// Each user has one file at a fixed key, overwritten on every upload.
// ---------------------------------------------------------------------------

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const avatarKey = (userId: string) => `avatars/${path.basename(userId)}`;

export async function uploadAvatar(userId: string, file: File): Promise<void> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isS3Configured()) {
    await getS3Client().send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: avatarKey(userId),
      Body: buffer,
      ContentType: file.type,
    }));
  } else {
    const filePath = localFilePath(`local://${avatarKey(userId)}`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }
}

export async function readAvatar(userId: string): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    let body: Buffer;
    let contentType: string | undefined;
    if (isS3Configured()) {
      const response = await getS3Client().send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: avatarKey(userId),
      }));
      if (!response.Body) return null;
      body = Buffer.from(await response.Body.transformToByteArray());
      contentType = response.ContentType;
    } else {
      body = await fs.readFile(localFilePath(`local://${avatarKey(userId)}`));
    }
    return { body, contentType: contentType || sniffImageType(body) };
  } catch {
    return null;
  }
}

export async function deleteAvatar(userId: string): Promise<void> {
  if (isS3Configured()) {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: avatarKey(userId) }));
  } else {
    await fs.unlink(localFilePath(`local://${avatarKey(userId)}`)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// CVs. Public like avatars, served by /api/cv/<username>. One PDF per user at a fixed key.
// ---------------------------------------------------------------------------

export const CV_MAX_BYTES = 5 * 1024 * 1024;

const cvKey = (userId: string) => `cvs/${path.basename(userId)}.pdf`;

/** True when the bytes start like a PDF file, whatever the browser claimed the type was. */
export function isPdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 5)).toString("latin1") === "%PDF-";
}

export async function uploadCv(userId: string, file: File): Promise<void> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isS3Configured()) {
    await getS3Client().send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: cvKey(userId),
      Body: buffer,
      ContentType: "application/pdf",
    }));
  } else {
    const filePath = localFilePath(`local://${cvKey(userId)}`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }
}

export async function readCv(userId: string): Promise<Buffer | null> {
  try {
    if (isS3Configured()) {
      const response = await getS3Client().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: cvKey(userId) }));
      return response.Body ? Buffer.from(await response.Body.transformToByteArray()) : null;
    }
    return await fs.readFile(localFilePath(`local://${cvKey(userId)}`));
  } catch {
    return null;
  }
}

export async function deleteCv(userId: string): Promise<void> {
  if (isS3Configured()) {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: cvKey(userId) }));
  } else {
    await fs.unlink(localFilePath(`local://${cvKey(userId)}`)).catch(() => {});
  }
}

function sniffImageType(bytes: Buffer): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.subarray(0, 3).toString() === "GIF") return "image/gif";
  if (bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return "application/octet-stream";
}
