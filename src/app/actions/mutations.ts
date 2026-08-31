"use server"

import { db } from "@/db";
import { books, projects, bookConcepts, conceptProjects, bookProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { bookSchema, projectSchema } from "./schema";

export async function saveBook(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const conceptIds = formData.getAll("conceptIds") as string[];
    
    const validatedData = bookSchema.parse({
      ...data,
      conceptIds,
    });

    const isUpdate = !!validatedData.id;
    let bookId = validatedData.id;

    const bookValues = {
      title: validatedData.title,
      authors: validatedData.authors,
      year: validatedData.year || null,
      status: validatedData.status,
      progress: validatedData.progress || 0,
      rating: validatedData.rating || null,
      coverUrl: validatedData.coverUrl || null,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      notes: validatedData.notes,
      updatedAt: new Date().toISOString(),
    };

    if (isUpdate) {
      await db.update(books).set(bookValues).where(eq(books.id, bookId!));
      // Delete existing relationships
      await db.delete(bookConcepts).where(eq(bookConcepts.bookId, bookId!));
    } else {
      const result = await db.insert(books).values(bookValues).returning({ id: books.id });
      bookId = result[0].id;
    }

    // Insert new relationships
    if (conceptIds.length > 0) {
      const inserts = conceptIds.map(conceptId => ({
        bookId: bookId!,
        conceptId,
      }));
      await db.insert(bookConcepts).values(inserts);
    }

    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath("/manage");
    if (isUpdate) revalidatePath(`/books/${bookId}`);

    return { success: true, message: isUpdate ? "Book updated successfully." : "Book added successfully." };
  } catch (error: any) {
    console.error("Save Book Error:", error);
    return { success: false, error: error.message || "Failed to save book." };
  }
}

export async function deleteBook(id: string) {
  try {
    await db.delete(books).where(eq(books.id, id));
    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath("/manage");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete book." };
  }
}

export async function saveProject(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const conceptIds = formData.getAll("conceptIds") as string[];
    const bookIds = formData.getAll("bookIds") as string[];
    
    const validatedData = projectSchema.parse({
      ...data,
      conceptIds,
      bookIds,
    });

    const isUpdate = !!validatedData.id;
    let projectId = validatedData.id;

    const projectValues = {
      name: validatedData.name,
      description: validatedData.description,
      repoUrl: validatedData.repoUrl || null,
      status: validatedData.status,
      techStack: validatedData.techStack ? JSON.stringify(validatedData.techStack.split(',').map(t => t.trim()).filter(Boolean)) : null,
      lessonsLearned: validatedData.lessonsLearned,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      updatedAt: new Date().toISOString(),
    };

    if (isUpdate) {
      await db.update(projects).set(projectValues).where(eq(projects.id, projectId!));
      // Delete existing relationships
      await db.delete(conceptProjects).where(eq(conceptProjects.projectId, projectId!));
      await db.delete(bookProjects).where(eq(bookProjects.projectId, projectId!));
    } else {
      const result = await db.insert(projects).values(projectValues).returning({ id: projects.id });
      projectId = result[0].id;
    }

    // Insert new relationships
    if (conceptIds.length > 0) {
      const inserts = conceptIds.map(conceptId => ({
        projectId: projectId!,
        conceptId,
      }));
      await db.insert(conceptProjects).values(inserts);
    }
    
    if (bookIds.length > 0) {
      const inserts = bookIds.map(bookId => ({
        projectId: projectId!,
        bookId,
      }));
      await db.insert(bookProjects).values(inserts);
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/manage");
    if (isUpdate) revalidatePath(`/projects/${projectId}`);

    return { success: true, message: isUpdate ? "Project updated successfully." : "Project added successfully." };
  } catch (error: any) {
    console.error("Save Project Error:", error);
    return { success: false, error: error.message || "Failed to save project." };
  }
}

export async function deleteProject(id: string) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/manage");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete project." };
  }
}
