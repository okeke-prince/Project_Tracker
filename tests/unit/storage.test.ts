import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CV_MAX_BYTES, deleteCv, isPdf, readCv, uploadCv } from "@/lib/storage";

describe("isPdf", () => {
  it("accepts files that start with the PDF header", () => {
    expect(isPdf(new TextEncoder().encode("%PDF-1.7\n..."))).toBe(true);
  });

  it("rejects other files, even if they're named .pdf", () => {
    expect(isPdf(new TextEncoder().encode("<html>"))).toBe(false);
    expect(isPdf(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe(false); // PNG
    expect(isPdf(new Uint8Array())).toBe(false);
  });
});

describe("CV storage on local disk", () => {
  let dir: string;

  beforeAll(async () => {
    // Make sure the S3 branch isn't taken and files land in a throwaway folder.
    vi.stubEnv("S3_BUCKET_NAME", "");
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "cv-test-"));
    vi.spyOn(process, "cwd").mockReturnValue(dir);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("stores, reads back and deletes a user's CV", async () => {
    const pdf = new File(["%PDF-1.4 hello"], "cv.pdf", { type: "application/pdf" });
    await uploadCv("user-1", pdf);
    expect((await readCv("user-1"))?.toString()).toBe("%PDF-1.4 hello");

    await deleteCv("user-1");
    expect(await readCv("user-1")).toBeNull();
  });

  it("returns null when there is no CV, and deleting a missing CV is fine", async () => {
    expect(await readCv("nobody")).toBeNull();
    await expect(deleteCv("nobody")).resolves.toBeUndefined();
  });

  it("can't be pointed outside the CV folder", async () => {
    await uploadCv("../../escape", new File(["%PDF-"], "cv.pdf"));
    await expect(fs.access(path.join(dir, "storage", "cvs", "escape.pdf"))).resolves.toBeUndefined();
  });

  it("allows CVs up to 5 MB", () => {
    expect(CV_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
