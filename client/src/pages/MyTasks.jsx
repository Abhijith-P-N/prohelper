import { useMemo, useState } from 'react'
import { Plus, Search, Filter, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'
import { TaskBoard } from '../components/tasks/TaskBoard'
import { TaskModal } from '../components/tasks/TaskModal'
import { currentDay, currentWeek } from '../lib/utils'

export default function MyTasks() {
  const { db, setTaskStatus } = useWorkspace()
  const toast = useToast()
  const [weekFilter, setWeekFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState({ open: false, task: null, status: 'todo' })

  const today = currentDay()
  const week = currentWeek()

  const tasks = useMemo(
    () =>
      db.tasks.filter((t) => {
        if (weekFilter !== 'all' && t.week !== Number(weekFilter)) return false
        if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false
        if (query && !`${t.title} ${t.description} ${t.key}`.toLowerCase().includes(query.toLowerCase())) return false
        return true
      }),
    [db.tasks, weekFilter, assigneeFilter, query]
  )

  const onStatus = async (id, status) => {
    try {
      await setTaskStatus(id, status, db.currentMember?.id)
      toast.info(`Task moved to ${status.toUpperCase()}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update task')
    }
  }

  return (
    <div>
      <SectionHeader
        title="My Tasks"
        subtitle={`Sprint day ${today}/21 · Week ${week} in progress. Kanban with dependencies & blockers.`}
        action={
          <button className="btn-primary" onClick={() => setModal({ open: true, task: null, status: 'todo' })}>
            <Plus size={15} /> New task
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input w-56 pl-9"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-500" />
          {['all', 1, 2, 3].map((w) => (
            <button
              key={w}
              onClick={() => setWeekFilter(w)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                weekFilter === w
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              {w === 'all' ? 'All weeks' : `W${w}`}
            </button>
          ))}
        </div>

        <select
          className="input w-44"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="all">Everyone</option>
          {db.teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
          <span className="chip border-danger/25 bg-danger/10 text-danger"><ListTodo size={11} /> blocked highlights</span>
          <Link to="/app/prompt-generator" className="chip border-accent/25 bg-accent/10 text-accent hover:underline">generate an AI prompt for these ↔</Link>
        </div>
      </div>

      {tasks.length ? (
        <TaskBoard tasks={tasks} onOpen={(task) => setModal({ open: true, task })} onCreate={(status) => setModal({ open: true, task: null, status })} onStatus={onStatus} />
      ) : (
        <EmptyBlock
          icon={ListTodo}
          title="No tasks match the filters"
          description="Adjust the week, assignee or search query, or create a new task."
          action={<button className="btn-primary" onClick={() => setModal({ open: true, task: null, status: 'todo' })}><Plus size={15} /> New task</button>}
        />
      )}

      <TaskModal
        open={modal.open}
        task={modal.task}
        initialStatus={modal.status}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </div>
  )
}