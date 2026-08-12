import { motion } from 'framer-motion'
import { Map, CheckCircle2, Circle, Play } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'
import { ProgressBar } from '../components/ui/Progress'
import { currentDay } from '../lib/utils'

const STATUS_META = {
  done: { label: 'DELIVERED', cls: 'border-accent/30 bg-accent/10 text-accent' },
  'in-progress': { label: 'IN PROGRESS', cls: 'border-warn/30 bg-warn/10 text-warn' },
  pending: { label: 'QUEUED', cls: 'border-white/10 bg-white/[0.03] text-slate-500' },
}

export default function Roadmap() {
  const { db, updateRoadmap, setTaskStatus } = useWorkspace()
  const toast = useToast()
  const day = currentDay()

  const weekStats = (week) => {
    const tasks = db.tasks.filter((t) => t.week === week)
    const done = tasks.filter((t) => t.status === 'done').length
    return { tasks: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
  }

  const cycleStatus = async (r) => {
    const order = { pending: 'in-progress', 'in-progress': 'done', done: 'pending' }
    try {
      await updateRoadmap(r.id, { status: order[r.status] })
      toast.info(`Week ${r.week} marked ${order[r.status] === 'done' ? 'delivered' : order[r.status] === 'in-progress' ? 'active' : 'queued'}`)
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  const shipAll = async (r) => {
    const ids = db.tasks.filter((t) => t.week === r.week && t.status !== 'done').map((t) => t.id)
    if (!ids.length) return toast.info('All week tasks are already done')
    try {
      for (const id of ids) await setTaskStatus(id, 'done')
      await updateRoadmap(r.id, { status: 'done' })
      toast.success(`Week ${r.week} marked delivered — ${ids.length} tasks completed`)
    } catch (err) {
      toast.error(err.message || 'Failed to ship tasks')
    }
  }

  return (
    <div>
      <SectionHeader
        title="Roadmap"
        subtitle="The 3-week sprint for the Secure File Sharing Platform. Delivery gates per phase."
      />

      <div className="mb-6 flex items-center gap-6">
        <span className="chip border-accent/25 bg-accent/10 text-accent"><Map size={12} /> PROTOTYPE → SECURITY → FINALIZATION</span>
        <span className="text-[11px] text-slate-500">Sprint day {day}/21</span>
      </div>

      {db.roadmap.length ? (

      <div className="relative grid gap-4 lg:grid-cols-3">
        <div className="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-accent/40 via-accent/60 to-accent/40 lg:block" />
        {db.roadmap.map((r, i) => {
          const meta = STATUS_META[r.status]
          const stats = weekStats(r.week)
          const Icon = r.status === 'done' ? CheckCircle2 : r.status === 'in-progress' ? Play : Circle
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="panel relative p-5"
            >
              <div className="flex items-center justify-between">
                <span className={`chip ${meta.cls}`}><Icon size={11} /> W{r.week} · {meta.label}</span>
                <span className="font-mono text-[10px] text-slate-600">{r.planned}</span>
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-white">{r.theme}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{r.goal}</p>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>DELIVERY</span>
                  <span className="font-mono text-accent">{stats.pct}%</span>
                </div>
                <ProgressBar value={stats.pct} height={6} />
                <p className="mt-1 text-[10px] text-slate-600">{stats.done}/{stats.tasks} tasks done</p>
              </div>

              <ul className="mt-4 space-y-1.5">
                {r.milestones.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {m}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                {r.status !== 'done' && (
                  <button className="btn-ghost flex-1 text-xs !py-1.5" onClick={() => cycleStatus(r)}>
                    {r.status === 'pending' ? 'Start week' : 'Cycle status'}
                  </button>
                )}
                {r.status === 'pending' ? (
                  <button className="btn-ghost flex-1 text-xs !py-1.5" onClick={() => shipAll(r)}>Ship all tasks</button>
                ) : r.status !== 'done' ? (
                  <button className="btn-primary flex-1 text-xs !py-1.5" onClick={() => shipAll(r)}>Mark delivered</button>
                ) : (
                  <span className="flex-1 text-center text-[11px] font-semibold text-accent">✓ Nothing left this week</span>
                )}
              </div>
            </motion.div>
          )
        })}
        </div>
      ) : (
        <EmptyBlock icon={Map} title="No roadmap yet" description="Plan the sprint in weeks — each week carries a theme, goal and delivery gates." />
      )}
    </div>
  )
}