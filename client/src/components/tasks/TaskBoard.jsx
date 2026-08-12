import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { blockedTaskIds } from '../../lib/utils'
import { TaskCard } from './TaskCard'
import { STATUS_BOARD } from './taskOptions'

export function TaskBoard({ tasks, onOpen, onCreate, onStatus }) {
  const { db } = useWorkspace()
  const blocked = blockedTaskIds(db.tasks, db.taskDependencies)

  return (
    <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_BOARD.map((col) => {
        const items = tasks.filter((t) => t.status === col.status)
        return (
          <motion.section
            key={col.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-[260px] flex-1 rounded-xl border border-white/5 bg-base-850/50 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-bold tracking-wide text-slate-200">{col.title}</p>
                <p className="text-[10px] text-slate-600">{col.blurb}</p>
              </div>
              <span className="rounded-md border border-white/5 bg-base-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                {items.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((t, i) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  index={i}
                  blockedDeps={blocked.get(t.id)}
                  onOpen={onOpen}
                  onStatus={onStatus}
                />
              ))}
              {items.length === 0 && (
                <button
                  onClick={() => onCreate(col.status)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-4 text-[11px] font-medium text-slate-600 transition hover:border-accent/30 hover:text-accent"
                >
                  <Plus size={13} /> Add to {col.title}
                </button>
              )}
            </div>
          </motion.section>
        )
      })}
    </div>
  )
}