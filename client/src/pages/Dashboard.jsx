import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, CheckCircle2, ListTodo, Gauge, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader, FadeIn } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'
import { StatCard, OverallProgress, TeamProgressStrip, BlockedList, ActivityFeed, SprintTimeline } from '../components/dashboard/widgets'
import { currentDay, currentWeek, blockedTaskIds } from '../lib/utils'

export default function Dashboard() {
  const { db } = useWorkspace()
  const { user } = useAuth()
  const week = currentWeek()
  const day = currentDay()
  const done = db.tasks.filter((t) => t.status === 'done').length
  const active = db.tasks.filter((t) => t.status === 'in-progress')
  const review = db.tasks.filter((t) => t.status === 'review')
  const upcoming = db.tasks.filter((t) => t.status === 'todo')
  const weekTasks = db.tasks.filter((t) => t.week === week)

  return (
    <div>
      <SectionHeader
        title={`Sprint ops, ${user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'operator'}`}
        subtitle="Live pulse of the Secure File Sharing Platform build."
        action={
          <Link to="/app/tasks" className="btn-ghost">
            Open task board <ArrowRight size={14} />
          </Link>
        }
      />

      {/* Week/day hero strip */}
      <FadeIn className="panel mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-slate-500">CURRENT WEEK</p>
          <p className="text-lg font-extrabold text-white">{week} of 3 <span className="text-slate-500">· {({ 1: 'Prototype', 2: 'Security', 3: 'Finalization' })[week]}</span></p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-slate-500">CURRENT DAY</p>
          <p className="text-lg font-extrabold text-white">Day {day} <span className="text-slate-500">/ 21</span></p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-slate-500">WEEK {week} TASK LOAD</p>
          <p className="text-lg font-extrabold text-accent">{weekTasks.length} items</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-[10px] tracking-widest text-slate-500">PHASE</p>
          <p className="text-sm font-bold text-warn">SECURITY PHASE IN PROGRESS</p>
        </div>
      </FadeIn>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label="Overall progress" value={`${Math.round((done / db.tasks.length) * 100)}%`} sub={`${done} / ${db.tasks.length} tasks shipped`} tone="accent" delay={0} />
        <StatCard icon={ListTodo} label="Active tasks" value={active.length + review.length} sub={`${active.length} in progress · ${review.length} in review`} tone="warn" delay={0.05} />
        <StatCard icon={AlertTriangle} label="Blocked tasks" value={blockedTaskIds(db.tasks, db.taskDependencies).size} sub="Waiting on uncompleted dependencies" tone="danger" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Upcoming" value={upcoming.length} sub="Queued across the 3-week plan" tone="info" delay={0.15} />
      </div>

      {/* Progress overview */}
      <FadeIn delay={0.05} className="mt-5 grid gap-4 lg:grid-cols-3">
        <OverallProgress />
        <div className="panel p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Team progress</p>
            <Link to="/app/team" className="text-[11px] font-semibold text-accent hover:underline">View team →</Link>
          </div>
          <TeamProgressStrip />
        </div>
      </FadeIn>

      {/* Bottom grid: activity + blocked + sprint */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <Card.Header icon={Activity} title="Recent activity" subtitle="Latest across git, tasks, DB & security" />
          <Card.Body>
            <ActivityFeed />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header
            icon={AlertTriangle}
            title="Blocked tasks"
            subtitle="Cleared when dependencies complete"
            action={<Link to="/app/tasks" className="text-[11px] font-semibold text-accent hover:underline">Board →</Link>}
          />
          <Card.Body>
            <BlockedList />
          </Card.Body>
        </Card>

        <div className="space-y-4">
          <Card>
            <Card.Header title="Sprint timeline" subtitle="Week status" />
            <Card.Body>
              <SprintTimeline />
            </Card.Body>
          </Card>
          <Card>
            <Card.Header title="Upcoming this phase" subtitle={`Week ${week} queue`} />
            <Card.Body>
              {upcoming.length ? (
                <ul className="space-y-2">
                  {upcoming.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <span className="font-mono text-slate-500">{t.key}</span> {t.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyBlock title="Nothing queued" description="Week tasks are all underway." />
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}