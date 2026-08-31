import { db } from "@/db";
import { books, concepts, projects } from "@/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooksSection } from "./books-section";
import { ProjectsSection } from "./projects-section";
import { desc } from "drizzle-orm";

export default async function ManagePage() {
  const allBooks = await db.query.books.findMany({
    orderBy: [desc(books.updatedAt)],
    with: {
      bookConcepts: true,
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
        <p className="text-muted-foreground mt-2">Add, update, or remove your books and projects.</p>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="books" className="mt-6">
          <BooksSection books={allBooks} concepts={allConcepts} />
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
          <ProjectsSection projects={allProjects} concepts={allConcepts} books={allBooks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
