import { motion } from 'framer-motion'
import { GitBranch, CircleDot, Activity } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { Avatar } from '../ui/Avatar'
import { ProgressBar } from '../ui/Progress'
import { StatusPill } from '../ui/Badges'
import { memberStats, taskBlockedStatus } from '../../lib/utils'

const statusDot = (status) =>
  status === 'online' ? 'bg-accent animate-pulse' : status === 'away' ? 'bg-warn' : 'bg-slate-600'

export function MemberCard({ member, index }) {
  const { db } = useWorkspace()
  const stats = memberStats(db)[member.id]
  const current = stats.current
  const blockedDep = current ? taskBlockedStatus(db.tasks, db.taskDependencies, current.id) : null
  const lastActivity = db.activityLogs.find((a) => a.actorId === member.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="panel panel-hover flex flex-col p-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={member.name} color={member.color} size={48} />
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base-850 ${statusDot(member.status)}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white">{member.name}</p>
          <p className="text-xs text-slate-500">{member.role}</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <CircleDot size={11} className={member.status === 'online' ? 'text-accent' : 'text-slate-600'} />
          {member.status}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-base-900/50 px-3 py-2.5">
        <span className="text-[11px] font-semibold text-slate-400">Tasks completed</span>
        <span className="font-mono text-sm font-bold text-accent">{stats.done} <span className="text-slate-600">/ {stats.total}</span></span>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
          <span>SPRINT PROGRESS</span>
          <span className="font-mono text-accent">{stats.progress}%</span>
        </div>
        <ProgressBar value={stats.progress} color={member.color} height={6} />
      </div>

      <div className="mt-4 rounded-lg border border-white/5 bg-base-900/40 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <Activity size={11} /> Current task
        </p>
        {current ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold leading-snug text-slate-200">
                {current.key} · {current.title}
              </p>
              <span className="shrink-0"><StatusPill status={current.status} /></span>
            </div>
            {blockedDep && (
              <p className="mt-1.5 text-[10px] text-danger">
                Blocked — waiting on {blockedDep.map((d) => d.key).join(', ')}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-600">No current task assigned.</p>
        )}
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <div className="flex items-center gap-2 rounded-md border border-white/5 bg-base-900/70 px-2.5 py-1.5">
          <GitBranch size={12} className="text-slate-500" />
          <code className="truncate font-mono text-[10px] text-accent">{member.branch}</code>
        </div>
        {lastActivity && (
          <p className="truncate text-[10px] text-slate-600">
            {lastActivity.action} {lastActivity.target}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export function StreamDeps() {
  const { db } = useWorkspace()
  const find = (rolePart) => db.teamMembers.find((m) => m.role && m.role.includes(rolePart)) || null
  const byRole = {
    frontend: find('Frontend'),
    backend: find('Backend'),
    security: find('Security'),
    database: find('Database') || find('DevOps'),
  }

  const streams = [
    { a: byRole.frontend, b: byRole.backend, label: 'Frontend consumes Backend API' },
    { a: byRole.backend, b: byRole.database, label: 'Backend reads/writes Database + Storage' },
    { a: byRole.security, b: byRole.backend, label: 'Security module integrates with Backend API' },
    { a: byRole.security, b: byRole.database, label: 'Encryption envelope stored by Database/Storage' },
  ].filter((s) => s.a && s.b)

  return (
    <div className="space-y-2.5">
      {streams.length ? (
        streams.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-white/5 bg-base-900/40 px-3 py-2.5">
            <Avatar name={s.a.name} color={s.a.color} size={24} />
            <span className="text-xs font-medium text-slate-300">{s.a.name}</span>
            <span className="flex-1 border-t border-dashed border-white/10" />
            <span className="text-[10px] text-slate-500">{s.label}</span>
            <span className="flex-1 border-t border-dashed border-white/10" />
            <Avatar name={s.b.name} color={s.b.color} size={24} />
            <span className="text-xs font-medium text-slate-300">{s.b.name}</span>
          </div>
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] text-slate-600">
          Streams appear once you have members with Frontend, Backend, Security and Database/DevOps roles.
        </p>
      )}
      <p className="px-1 text-[10px] text-slate-600">
        Pull-request reviews flow the same direction. No cross-stream merge conflicts without a review.
      </p>
    </div>
  )
}