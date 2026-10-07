import { db } from "@/db";
import { books, concepts, projects } from "@/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooksSection } from "./books-section";
import { ProjectsSection } from "./projects-section";
import { ConceptsSection } from "./concepts-section";
import { desc } from "drizzle-orm";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ManagePage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const allBooks = await db.query.books.findMany({
    orderBy: [desc(books.updatedAt)],
    with: {
      bookConcepts: true,
      bookProjects: true,
    }
  });
  
  const allProjects = await db.query.projects.findMany({
    orderBy: [desc(projects.updatedAt)],
    with: {
      conceptProjects: true,
      bookProjects: true,
    }
  });

  const allConcepts = await db.query.concepts.findMany({
    orderBy: [concepts.name]
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Knowledge</h1>
        <p className="text-muted-foreground mt-2">Add, update, or remove your books, projects, and concepts.</p>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
