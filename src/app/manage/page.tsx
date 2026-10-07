import { db } from "@/db";
import { books, concepts, projects, milestones, users } from "@/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooksSection } from "./books-section";
import { ProjectsSection } from "./projects-section";
import { ConceptsSection } from "./concepts-section";
import { MilestonesSection } from "./milestones-section";
import { ProfileForm } from "@/components/forms/profile-form";
import { desc, eq } from "drizzle-orm";

import { requireUserId } from "@/lib/session";

const TABS = ["books", "projects", "concepts", "milestones", "profile"];

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const userId = await requireUserId();
  const { tab } = await searchParams;
  const defaultTab = tab && TABS.includes(tab) ? tab : "books";

  const allBooks = await db.query.books.findMany({
    where: eq(books.userId, userId),
    orderBy: [desc(books.updatedAt)],
    with: {
      bookConcepts: true,
      bookProjects: true,
    }
  });
  
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.updatedAt)],
    with: {
      conceptProjects: true,
      bookProjects: true,
    }
  });

  const allConcepts = await db.query.concepts.findMany({
    where: eq(concepts.userId, userId),
    orderBy: [concepts.name]
  });

  const allMilestones = await db.query.milestones.findMany({
    where: eq(milestones.userId, userId),
    orderBy: [desc(milestones.date)],
  });

  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, username: true, headline: true, bio: true, image: true },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Knowledge</h1>
        <p className="text-muted-foreground mt-2">Add, update, or remove your books, projects, concepts and milestones.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-[750px]">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="books" className="mt-6">
          <BooksSection books={allBooks} concepts={allConcepts} projects={allProjects} />
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
          <ProjectsSection projects={allProjects} concepts={allConcepts} books={allBooks} />
        </TabsContent>
        <TabsContent value="concepts" className="mt-6">
          <ConceptsSection concepts={allConcepts} />
        </TabsContent>
        <TabsContent value="milestones" className="mt-6">
          <MilestonesSection milestones={allMilestones} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          {profile && <ProfileForm profile={profile} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
