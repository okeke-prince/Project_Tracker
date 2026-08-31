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
  tags: z.string().optional(),
  conceptIds: z.array(z.string()).optional(),
  bookIds: z.array(z.string()).optional(),
});
