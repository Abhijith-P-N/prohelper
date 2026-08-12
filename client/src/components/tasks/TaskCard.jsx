import { motion } from 'framer-motion'
import { Link2, Lock } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { memberById, taskById, formatDate } from '../../lib/utils'
import { PriorityPill } from '../ui/Badges'
import { Avatar } from '../ui/Avatar'

export function TaskCard({ task, blockedDeps, onOpen, onStatus, index = 0 }) {
  const { db } = useWorkspace()
  const assignee = memberById(db.teamMembers, task.assigneeId)
  const deps = db.taskDependencies.filter((d) => d.taskId === task.id)

  const open = (e) => {
    e.stopPropagation()
    onOpen(task)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      onClick={open}
      className="group cursor-pointer rounded-lg border border-white/5 bg-base-900/60 p-3 transition-all hover:border-accent/25 hover:bg-base-850"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[9px] font-semibold tracking-widest text-slate-600">#{task.key}</span>
        <div className="flex gap-1.5">
          <PriorityPill priority={task.priority} />
        </div>
      </div>

      <p className="mt-1.5 text-[13px] font-semibold leading-snug text-slate-100 group-hover:text-white">{task.title}</p>
      {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{task.description}</p>}

      {blockedDeps?.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-danger/25 bg-danger/5 p-1.5 text-[10px] text-danger">
          <Lock size={11} className="mt-0.5 shrink-0" />
          <span>
            Blocked — waiting on {blockedDeps.map((d) => d.key).join(', ')}
          </span>
        </div>
      )}

      {deps.length > 0 && !blockedDeps?.length && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
          <Link2 size={11} />
          {deps.map((d) => {
            const depTask = taskById(db.tasks, d.dependsOnId)
            return <span key={d.id} className="font-mono">{depTask?.key}</span>
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
        <span className="flex items-center gap-2">
          {assignee ? (
            <>
              <Avatar name={assignee.name} color={assignee.color} size={22} />
              <span className="text-[10px] font-medium text-slate-400">{assignee.name}</span>
            </>
          ) : (
            <span className="text-[10px] text-slate-600">Unassigned</span>
          )}
        </span>
        {onStatus ? (
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStatus(task.id, e.target.value)}
            className="cursor-pointer rounded border border-white/10 bg-base-800 px-1 py-0.5 text-[10px] font-semibold text-slate-300 outline-none focus:border-accent/40"
            aria-label={`Status for ${task.title}`}
          >
            {['todo', 'in-progress', 'review', 'done'].map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] text-slate-500">{task.dueDate ? formatDate(task.dueDate) : 'No date'}</span>
        )}
      </div>
    </motion.div>
  )
}