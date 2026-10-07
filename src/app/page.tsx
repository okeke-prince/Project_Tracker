import { getDashboardMetrics, getInProgressItems, getRecentActivity, getMasterySnapshot, getRecentlyMastered } from "@/db/queries";
import { Book, Compass, Folder, ChevronRight, CheckCircle2, ArrowRight, BookOpen, PenTool } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { auth } from "@/auth";

export default async function Dashboard() {
  const session = await auth();
  const metrics = await getDashboardMetrics();
  const inProgress = await getInProgressItems();
  const recentActivity = await getRecentActivity();
  const snapshot = await getMasterySnapshot();
  const recentlyMastered = await getRecentlyMastered();

  const overallProgress = metrics.totalConcepts > 0 
    ? Math.round((metrics.masteredOrAppliedConcepts / metrics.totalConcepts) * 100) 
    : 0;

  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Top section - Hero & Metrics */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}, Udo.</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard 
            title="Books Finished" 
            value={metrics.booksFinished.toString()} 
            icon={Book} 
            href="/books?status=finished" 
          />
          <MetricCard 
            title="Concepts Mastered" 
            value={metrics.conceptsMastered.toString()} 
            icon={Compass} 
            href="/concepts?status=mastered" 
          />
          <MetricCard 
            title="Projects Completed" 
            value={metrics.projectsCompleted.toString()} 
            icon={Folder} 
            href="/projects?status=completed" 
          />
          <Link href="/concepts">
            <Card className="hover:border-primary/50 transition-all cursor-pointer shadow-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                <Compass className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallProgress}%</div>
                <Progress value={overallProgress} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-2">{metrics.masteredOrAppliedConcepts} of {metrics.totalConcepts} concepts applied</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Middle section - Two columns */}
      <section className="grid gap-8 md:grid-cols-7">
        
        {/* Left Column - Continue Learning */}
        <div className="md:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Continue Learning</h2>
          </div>
          
          <div className="space-y-4">
            {inProgress.books.map(book => (
              <InProgressCard 
                key={`book-${book.id}`}
                type="book"
                id={book.id}
                title={book.title}
                subtitle={book.authors}
                status={book.status}
                icon={BookOpen}
                fileUrl={book.fileUrl}
                progress={book.progress}
                session={session}
              />
            ))}
            {inProgress.concepts.map(concept => (
              <InProgressCard 
                key={`concept-${concept.id}`}
                type="concept"
                id={concept.id}
                title={concept.name}
                subtitle={concept.shortDescription || "No description"}
                status={concept.status}
                icon={PenTool}
              />
            ))}
            {inProgress.projects.map(project => (
              <InProgressCard 
                key={`project-${project.id}`}
                type="project"
                id={project.id}
                title={project.name}
                subtitle="Active Project"
                status={project.status}
                icon={Folder}
              />
            ))}
            
            {inProgress.books.length === 0 && inProgress.concepts.length === 0 && inProgress.projects.length === 0 && (
              <div className="p-8 text-center border rounded-xl border-dashed">
                <p className="text-muted-foreground">You have no items currently in progress.</p>
                <Link href="/concepts" className="text-primary hover:underline mt-2 inline-block">Explore Concepts Map</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {recentActivity.map((activity, idx) => (
                  <div key={`${activity.type}-${activity.id}-${idx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {activity.status === 'mastered' || activity.status === 'finished' || activity.status === 'completed' 
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 
                        : (activity.type === 'book' ? <Book className="h-4 w-4 text-muted-foreground" /> : activity.type === 'concept' ? <Compass className="h-4 w-4 text-muted-foreground" /> : <Folder className="h-4 w-4 text-muted-foreground" />)
                      }
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <span className="font-bold text-sm text-muted-foreground capitalize">{activity.type}</span>
                        <time className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {new Date(activity.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </time>
                      </div>
                      <Link href={`/${activity.type}s/${activity.id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">
                        {activity.title}
                      </Link>
                      <Badge variant="outline" className={`mt-2 text-[10px] uppercase tracking-wider ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom section - Mastery & Quick Access */}
      <section className="space-y-6 pt-6 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Mastery Snapshot</h2>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium">Mastered</span>
                      </div>
                      <span className="text-sm font-bold">{snapshot.mastered}</span>
                    </div>
                    <Progress value={snapshot.total > 0 ? (snapshot.mastered / snapshot.total) * 100 : 0} className="h-2 [&>div]:bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                        <span className="text-sm font-medium">Applied</span>
                      </div>
                      <span className="text-sm font-bold">{snapshot.applied}</span>
                    </div>
                    <Progress value={snapshot.total > 0 ? (snapshot.applied / snapshot.total) * 100 : 0} className="h-2 [&>div]:bg-sky-500" />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-medium">Studied</span>
                      </div>
                      <span className="text-sm font-bold">{snapshot.studied}</span>
                    </div>
                    <Progress value={snapshot.total > 0 ? (snapshot.studied / snapshot.total) * 100 : 0} className="h-2 [&>div]:bg-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Recently Conquered</h2>
              <Link href="/concepts?status=mastered" className="text-sm text-primary flex items-center hover:underline">
                View all <ArrowRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
            <div className="grid gap-3">
              {recentlyMastered.map(item => (
                <Link key={`${item.type}-${item.id}`} href={`/${item.type}s/${item.id}`}>
                  <Card className="hover:border-emerald-500/50 transition-colors shadow-sm group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        {item.type === 'book' ? <Book className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.type === 'book' ? 'Book Finished' : 'Concept Mastered'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
        </div>
      </section>

    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, icon: Icon, href }: { title: string, value: string, icon: any, href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer shadow-sm group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InProgressCard({ type, id, title, subtitle, status, icon: Icon, fileUrl, progress, session }: any) {
  const isEpub = type === 'book' && typeof fileUrl === 'string' && fileUrl.includes('.epub');
  const hasFile = type === 'book' && !!fileUrl;
  const href = hasFile && session ? `/read/${id}` : `/${type}s/${id}`;
  
  return (
    <Link href={href} className="block group">
      <Card className="shadow-sm hover:shadow-md transition-all hover:border-primary/40 relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-').replace('/10', '')}`} />
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted group-hover:bg-background transition-colors shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{title}</h4>
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {progress !== undefined && progress > 0 && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            )}
            <Badge variant="outline" className={`hidden sm:inline-flex capitalize ${getStatusColor(status)}`}>
              {status.replace('-', ' ')}
            </Badge>
            <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Resume <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getStatusColor(status: string) {
  switch(status) {
    case 'mastered':
    case 'finished':
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'applied':
    case 'reading':
    case 'in-progress':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    case 'studied':
    case 'reference':
    case 'idea':
    case 'want-to-read':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    default: 
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}
