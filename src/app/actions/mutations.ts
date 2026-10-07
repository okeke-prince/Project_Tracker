"use server"

import { db } from "@/db";
import { books, projects, concepts, milestones, users, bookConcepts, conceptProjects, bookProjects } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { bookSchema, projectSchema, conceptSchema, milestoneSchema, profileSchema } from "./schema";
import { uploadBookFile, deleteBookFile } from "@/lib/storage";
import { getActionUserId } from "@/lib/session";
import { normalizeUsername, validateUsername, isUsernameTaken } from "@/lib/username";
import { getUsername } from "@/db/queries";

const today = () => new Date().toISOString().slice(0, 10);

// Keep only the ids that belong to this user, so nobody can link to someone else's items.
async function ownedConceptIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.select({ id: concepts.id }).from(concepts).where(and(eq(concepts.userId, userId), inArray(concepts.id, ids)));
  return rows.map(r => r.id);
}

async function ownedProjectIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.userId, userId), inArray(projects.id, ids)));
  return rows.map(r => r.id);
}

async function ownedBookIds(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.select({ id: books.id }).from(books).where(and(eq(books.userId, userId), inArray(books.id, ids)));
  return rows.map(r => r.id);
}

async function revalidateProfile(userId: string) {
  const username = await getUsername(userId);
  if (username) revalidatePath(`/${username}`);
}

export async function saveBook(prevState: any, formData: FormData) {
  try {
    const userId = await getActionUserId();
    const data = Object.fromEntries(formData.entries());
    const conceptIds = await ownedConceptIds(userId, formData.getAll("conceptIds") as string[]);
    const projectIds = await ownedProjectIds(userId, formData.getAll("projectIds") as string[]);
    const bookFile = formData.get("bookFile") as File | null;
    
    // Remove the file from data before validation to prevent Zod errors
    delete data.bookFile;
    
    const validatedData = bookSchema.parse({
      ...data,
      conceptIds,
    });

    const isUpdate = !!validatedData.id;
    let bookId = validatedData.id;

    let existing: typeof books.$inferSelect | undefined;
    if (isUpdate) {
      existing = (await db.select().from(books).where(and(eq(books.id, bookId!), eq(books.userId, userId))))[0];
      if (!existing) throw new Error("Book not found.");
    }
    
    let uploadedFileUrl = undefined;
    if (bookFile && bookFile.size > 0) {
      uploadedFileUrl = await uploadBookFile(bookFile);
    }

    // Finished books need a date for the timeline; default to today when first marked finished.
    const finishedAt = validatedData.status === 'finished'
      ? (validatedData.finishedAt || existing?.finishedAt || today())
      : null;

    const bookValues = {
      title: validatedData.title,
      authors: validatedData.authors,
      year: validatedData.year || null,
      status: validatedData.status,
      progress: validatedData.progress || 0,
      rating: validatedData.rating || null,
      coverUrl: validatedData.coverUrl || null,
      ...(uploadedFileUrl ? { fileUrl: uploadedFileUrl } : {}),
      finishedAt,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      notes: validatedData.notes,
      updatedAt: new Date().toISOString(),
    };

    if (isUpdate) {
      await db.update(books).set(bookValues).where(and(eq(books.id, bookId!), eq(books.userId, userId)));
      // Delete existing relationships
      await db.delete(bookConcepts).where(eq(bookConcepts.bookId, bookId!));
      await db.delete(bookProjects).where(eq(bookProjects.bookId, bookId!));
    } else {
      const result = await db.insert(books).values({ ...bookValues, userId }).returning({ id: books.id });
      bookId = result[0].id;
    }

    // Insert concept relationships
    if (conceptIds.length > 0) {
      const inserts = conceptIds.map(conceptId => ({
        bookId: bookId!,
        conceptId,
      }));
      await db.insert(bookConcepts).values(inserts);
    }

    // Insert project relationships
    if (projectIds.length > 0) {
      const inserts = projectIds.map(projectId => ({
        bookId: bookId!,
        projectId,
      }));
      await db.insert(bookProjects).values(inserts);
    }

    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath("/manage");
    if (isUpdate) revalidatePath(`/books/${bookId}`);
    await revalidateProfile(userId);

    return { success: true, message: isUpdate ? "Book updated successfully." : "Book added successfully." };
  } catch (error: any) {
    console.error("Save Book Error:", error);
    return { success: false, error: error.message || "Failed to save book." };
  }
}

export async function deleteBook(id: string) {
  try {
    const userId = await getActionUserId();
    // Fetch the book first so we can delete its file
    const bookResult = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, userId)));
    const book = bookResult[0];
    if (!book) return { success: false, error: "Book not found." };
    
    if (book.fileUrl) {
      await deleteBookFile(book.fileUrl).catch((err) => {
        console.warn("Could not delete book file:", err);
        // Don't block the delete if file cleanup fails
      });
    }
    
    await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)));
    revalidatePath("/");
    revalidatePath("/books");
    revalidatePath("/manage");
    await revalidateProfile(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete book." };
  }
}

export async function saveProject(prevState: any, formData: FormData) {
  try {
    const userId = await getActionUserId();
    const data = Object.fromEntries(formData.entries());
    const conceptIds = await ownedConceptIds(userId, formData.getAll("conceptIds") as string[]);
    const bookIds = await ownedBookIds(userId, formData.getAll("bookIds") as string[]);
    
    const validatedData = projectSchema.parse({
      ...data,
      conceptIds,
      bookIds,
    });

    const isUpdate = !!validatedData.id;
    let projectId = validatedData.id;

    let existing: typeof projects.$inferSelect | undefined;
    if (isUpdate) {
      existing = (await db.select().from(projects).where(and(eq(projects.id, projectId!), eq(projects.userId, userId))))[0];
      if (!existing) throw new Error("Project not found.");
    }

    let gitCreatedAt = null;
    if (!isUpdate && validatedData.repoUrl?.includes("github.com/")) {
      try {
        const urlParts = new URL(validatedData.repoUrl).pathname.split('/').filter(Boolean);
        if (urlParts.length >= 2) {
          const owner = urlParts[0];
          let repo = urlParts[1];
          if (repo.endsWith('.git')) repo = repo.slice(0, -4);
          
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
          if (res.ok) {
            const data = await res.json();
            gitCreatedAt = data.created_at;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch github repo info", err);
      }
    }

    // A start date typed in the form wins over the GitHub repo date.
    const startedAt = validatedData.startedAt || gitCreatedAt;
    const completedAt = validatedData.status === 'completed'
      ? (validatedData.completedAt || existing?.completedAt || today())
      : null;

    const projectValues = {
      name: validatedData.name,
      description: validatedData.description,
      repoUrl: validatedData.repoUrl || null,
      status: validatedData.status,
      techStack: validatedData.techStack ? JSON.stringify(validatedData.techStack.split(',').map(t => t.trim()).filter(Boolean)) : null,
      lessonsLearned: validatedData.lessonsLearned,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      completedAt,
      updatedAt: new Date().toISOString(),
      ...(startedAt ? { createdAt: startedAt } : {}),
    };

    if (isUpdate) {
      await db.update(projects).set(projectValues).where(and(eq(projects.id, projectId!), eq(projects.userId, userId)));
      // Delete existing relationships
      await db.delete(conceptProjects).where(eq(conceptProjects.projectId, projectId!));
      await db.delete(bookProjects).where(eq(bookProjects.projectId, projectId!));
    } else {
      const result = await db.insert(projects).values({ ...projectValues, userId }).returning({ id: projects.id });
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
    await revalidateProfile(userId);

    return { success: true, message: isUpdate ? "Project updated successfully." : "Project added successfully." };
  } catch (error: any) {
    console.error("Save Project Error:", error);
    return { success: false, error: error.message || "Failed to save project." };
  }
}

export async function deleteProject(id: string) {
  try {
    const userId = await getActionUserId();
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/manage");
    await revalidateProfile(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete project." };
  }
}

export async function saveConcept(prevState: any, formData: FormData) {
  try {
    const userId = await getActionUserId();
    const data = Object.fromEntries(formData.entries());
    
    // Auto-generate slug from name if not provided
    if (!data.slug && data.name) {
      data.slug = (data.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const validatedData = conceptSchema.parse(data);

    const isUpdate = !!validatedData.id;
    let conceptId = validatedData.id;

    // Slugs only need to be unique within one user's concepts.
    const clash = await db.query.concepts.findFirst({
      where: and(eq(concepts.userId, userId), eq(concepts.slug, validatedData.slug)),
    });
    if (clash && clash.id !== conceptId) {
      return { success: false, error: `You already have a concept with the slug "${validatedData.slug}".` };
    }

    const conceptValues = {
      name: validatedData.name,
      slug: validatedData.slug,
      shortDescription: validatedData.shortDescription || null,
      status: validatedData.status,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      notes: validatedData.notes,
      updatedAt: new Date().toISOString(),
    };

    if (isUpdate) {
      const result = await db.update(concepts).set(conceptValues)
        .where(and(eq(concepts.id, conceptId!), eq(concepts.userId, userId)))
        .returning({ id: concepts.id });
      if (result.length === 0) throw new Error("Concept not found.");
    } else {
      const result = await db.insert(concepts).values({ ...conceptValues, userId }).returning({ id: concepts.id });
      conceptId = result[0].id;
    }

    revalidatePath("/");
    revalidatePath("/concepts");
    revalidatePath("/manage");
    if (isUpdate) revalidatePath(`/concepts/${conceptId}`);
    await revalidateProfile(userId);

    return { success: true, message: isUpdate ? "Concept updated successfully." : "Concept added successfully." };
  } catch (error: any) {
    console.error("Save Concept Error:", error);
    return { success: false, error: error.message || "Failed to save concept." };
  }
}

export async function deleteConcept(id: string) {
  try {
    const userId = await getActionUserId();
    await db.delete(concepts).where(and(eq(concepts.id, id), eq(concepts.userId, userId)));
    revalidatePath("/");
    revalidatePath("/concepts");
    revalidatePath("/manage");
    await revalidateProfile(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete concept." };
  }
}

export async function saveMilestone(prevState: any, formData: FormData) {
  try {
    const userId = await getActionUserId();
    const validatedData = milestoneSchema.parse(Object.fromEntries(formData.entries()));
    const isUpdate = !!validatedData.id;

    const values = {
      title: validatedData.title,
      type: validatedData.type,
      date: validatedData.date,
      description: validatedData.description || null,
      link: validatedData.link || null,
      updatedAt: new Date().toISOString(),
    };

    if (isUpdate) {
      const result = await db.update(milestones).set(values)
        .where(and(eq(milestones.id, validatedData.id!), eq(milestones.userId, userId)))
        .returning({ id: milestones.id });
      if (result.length === 0) throw new Error("Milestone not found.");
    } else {
      await db.insert(milestones).values({ ...values, userId });
    }

    revalidatePath("/");
    revalidatePath("/manage");
    await revalidateProfile(userId);

    return { success: true, message: isUpdate ? "Milestone updated." : "Milestone added." };
  } catch (error: any) {
    console.error("Save Milestone Error:", error);
    return { success: false, error: error.message || "Failed to save milestone." };
  }
}

export async function deleteMilestone(id: string) {
  try {
    const userId = await getActionUserId();
    await db.delete(milestones).where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
    revalidatePath("/");
    revalidatePath("/manage");
    await revalidateProfile(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete milestone." };
  }
}

export async function saveProfile(prevState: any, formData: FormData) {
  try {
    const userId = await getActionUserId();
    const validatedData = profileSchema.parse(Object.fromEntries(formData.entries()));
    const username = normalizeUsername(validatedData.username);

    const usernameError = validateUsername(username);
    if (usernameError) return { success: false, error: usernameError };
    if (await isUsernameTaken(username, userId)) return { success: false, error: "That username is already taken." };

    const previousUsername = await getUsername(userId);

    await db.update(users).set({
      name: validatedData.name,
      username,
      headline: validatedData.headline || null,
      bio: validatedData.bio || null,
    }).where(eq(users.id, userId));

    if (previousUsername) revalidatePath(`/${previousUsername}`);
    revalidatePath(`/${username}`);
    revalidatePath("/manage");
    revalidatePath("/", "layout");

    return { success: true, message: "Profile saved." };
  } catch (error: any) {
    console.error("Save Profile Error:", error);
    return { success: false, error: error.message || "Failed to save profile." };
  }
}
