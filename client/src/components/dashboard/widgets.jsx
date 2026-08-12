import { motion } from 'framer-motion'
import { useWorkspace } from '../../context/WorkspaceContext'
import { Ring, ProgressBar } from '../ui/Progress'
import { memberById, taskById, blockedTaskIds, currentWeek } from '../../lib/utils'

export function StatCard({ icon: Icon, label, value, sub, tone = 'default', delay = 0 }) {
  const tones = {
    default: 'text-slate-400',
    accent: 'text-accent',
    warn: 'text-warn',
    danger: 'text-danger',
    info: 'text-info',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="panel panel-hover p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          {Icon && <Icon size={15} className={tones[tone]} />}
        </div>
        <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
        {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
      </div>
    </motion.div>
  )
}

export function OverallProgress() {
  const { db } = useWorkspace()
  const done = db.tasks.filter((t) => t.status === 'done').length
  const pct = done / db.tasks.length
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-4">
        <Ring value={pct * 100} size={76} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Sprint progress</p>
          <p className="text-xs text-slate-500">{done} of {db.tasks.length} tasks complete</p>
          <ProgressBar value={pct * 100} className="mt-2" />
          {pct < 0.5 ? (
            <p className="mt-2 text-[11px] text-warn">Behind pace — blocked items are throttling delivery</p>
          ) : (
            <p className="mt-2 text-[11px] text-accent">On pace — keep shipping</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function TeamProgressStrip() {
  const { db } = useWorkspace()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {db.teamMembers.map((m, i) => {
        const mine = db.tasks.filter((t) => t.assigneeId === m.id)
        const done = mine.filter((t) => t.status === 'done').length
        const pct = mine.length ? Math.round((done / mine.length) * 100) : 0
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="panel p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{m.name}</span>
              <span className="font-mono text-xs font-bold" style={{ color: m.color }}>{pct}%</span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{m.role}</p>
            <ProgressBar value={pct} color={m.color} className="mt-2.5" height={5} />
          </motion.div>
        )
      })}
    </div>
  )
}

export function BlockedList({ limit = 6 }) {
  const { db } = useWorkspace()
  const blocked = blockedTaskIds(db.tasks, db.taskDependencies)
  const entries = [...blocked.entries()].slice(0, limit)
  if (!entries.length) return <p className="text-xs text-slate-500">No blocked tasks right now.</p>
  return (
    <div className="space-y-2.5">
      {entries.map(([id, deps]) => {
        const t = taskById(db.tasks, id)
        const assignee = memberById(db.teamMembers, t.assigneeId)
        return (
          <div key={id} className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 p-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-danger" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{t.title} <span className="text-slate-500">({t.key})</span></p>
              <p className="mt-1 text-[10px] text-slate-400">
                blocked by {deps.map((d) => `${d.key} · ${d.title}`).join(', ')}
              </p>
              {assignee && <p className="mt-0.5 text-[10px] text-slate-500">{assignee.name} · due {t.dueDate}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ActivityFeed({ limit = 7 }) {
  const { db } = useWorkspace()
  const items = db.activityLogs.slice(0, limit)
  return (
    <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[5px] before:w-px before:bg-white/5">
      {items.map((a, i) => {
        const actor = memberById(db.teamMembers, a.actorId)
        return (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex items-start gap-3 pl-6"
          >
            <span
              className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
              style={{ background: actor ? actor.color : '#64748b', boxShadow: `0 0 0 3px ${actor ? actor.color + '33' : '#64748b33'}` }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">{actor?.name || 'System'}</span>{' '}
                <span className="text-slate-500">{a.action}</span> {a.target}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-600">{a.type} · {a.at.slice(0, 16).replace('T', ' ')}Z</p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

export function SprintTimeline() {
  const { db } = useWorkspace()
  const now = currentWeek()
  return (
    <div className="space-y-3">
      {db.roadmap.map((r) => {
        const current = r.week === now
        const meta =
          r.status === 'done' ? { label: 'DELIVERED', cls: 'border-accent/30 bg-accent/10 text-accent' }
          : current ? { label: 'ACTIVE', cls: 'border-warn/30 bg-warn/10 text-warn' }
          : { label: 'QUEUED', cls: 'border-white/10 bg-white/[0.03] text-slate-500' }
        return (
          <div key={r.id} className={`flex items-center gap-3 rounded-lg border p-3 ${current ? 'border-warn/25 bg-warn/5' : 'border-white/5'}`}>
            <span className={`chip ${meta.cls}`}>W{r.week} · {meta.label}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">{r.theme}</p>
              <p className="truncate text-[10px] text-slate-500">{r.goal}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}