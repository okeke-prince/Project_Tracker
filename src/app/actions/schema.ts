import { z } from "zod";

export const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  authors: z.string().min(1, "Authors are required"),
  year: z.coerce.number().optional().or(z.literal("")),
  status: z.enum(["want-to-read", "reading", "finished", "reference"]),
  progress: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5).optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().optional().or(z.literal("")),
  finishedAt: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  conceptIds: z.array(z.string()).optional(),
});

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  repoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["idea", "in-progress", "completed", "archived"]),
  techStack: z.string().optional(),
  lessonsLearned: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  tags: z.string().optional(),
  conceptIds: z.array(z.string()).optional(),
  bookIds: z.array(z.string()).optional(),
});

export const conceptSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  shortDescription: z.string().optional(),
  status: z.enum(["studied", "applied", "mastered"]),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a full date");

export const milestoneSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.enum(["education", "certification", "work", "award", "other"]),
  date: isoDate,
  description: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  headline: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
});
