import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useToast } from '../../context/ToastContext'
import { STATUSES, PRIORITIES } from '../../lib/constants'
import { WEEKS } from '../tasks/taskOptions'

export function TaskModal({ open, onClose, task, initialStatus = 'todo' }) {
  const { db, addTask, updateTask, deleteTask, addDependency, removeDependency } = useWorkspace()
  const toast = useToast()
  const editing = Boolean(task)
  const defaultAssignee = db.currentMember?.id || ''

  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: defaultAssignee,
    week: 1,
    dueDate: '',
    tags: '',
  }))
  const [deps, setDeps] = useState([])

  useEffect(() => {
    if (!open) return
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId || '',
        week: task.week,
        dueDate: task.dueDate || '',
        tags: (task.tags || []).join(', '),
      })
      setDeps(db.taskDependencies.filter((d) => d.taskId === task.id).map((d) => d.dependsOnId))
    } else {
      setForm({
        title: '',
        description: '',
        status: initialStatus || 'todo',
        priority: 'medium',
        assigneeId: defaultAssignee,
        week: 1,
        dueDate: '',
        tags: '',
      })
      setDeps([])
    }
  }, [open, task])

  const candidates = useMemo(
    () => db.tasks.filter((t) => !editing || t.id !== task.id),
    [db.tasks, editing, task]
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      week: Number(form.week),
      dueDate: form.dueDate,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      if (editing) {
        await updateTask(task.id, payload)
        const existing = db.taskDependencies.filter((d) => d.taskId === task.id)
        for (const d of existing) {
          if (!deps.includes(d.dependsOnId)) await removeDependency(d.id)
        }
        for (const depId of deps) {
          if (!existing.some((d) => d.dependsOnId === depId)) await addDependency(task.id, depId)
        }
        toast.success('Task updated')
      } else {
        const id = await addTask(payload)
        for (const depId of deps) await addDependency(id, depId)
        toast.success('Task created')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save task')
    }
  }

  const onDelete = async () => {
    if (!task) return
    if (window.confirm(`Delete ${task.key} — "${task.title}"? This removes it and its dependencies.`)) {
      try {
        await deleteTask(task.id)
        toast.success('Task deleted')
        onClose()
      } catch (err) {
        toast.error(err.message || 'Failed to delete task')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${task.key} — ${task.title}` : 'New task'}
      subtitle={editing ? `Assigned to ${task.assigneeId || 'nobody'}` : 'Add a task to the sprint board'}
      width="max-w-2xl"
      footer={
        <>
          {editing && (
            <button type="button" onClick={onDelete} className="btn-danger mr-auto">
              Delete task
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="button" onClick={submit} className="btn-primary">{editing ? 'Save changes' : 'Create task'}</button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Upload UI progress states" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea className="input min-h-[72px]" value={form.description} onChange={set('description')} placeholder="What does success look like for this task?" />
        </div>
        <div>
          <label className="label">Assignee</label>
          <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
            {db.teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Week</label>
          <select className="input" value={form.week} onChange={set('week')}>
            {WEEKS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due date</label>
          <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tags <span className="normal-case text-slate-600">(comma separated)</span></label>
          <input className="input" value={form.tags} onChange={set('tags')} placeholder="frontend, upload, design" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Depends on</label>
          <p className="mb-2 text-[11px] text-slate-500">Pick tasks that must be complete before this one can start. Prevents integration dead-ends.</p>
          <div className="grid max-h-44 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {candidates.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/5 bg-base-900/50 px-3 py-2 text-xs hover:border-accent/25">
                <input
                  type="checkbox"
                  checked={deps.includes(t.id)}
                  onChange={(e) =>
                    setDeps((prev) =>
                      e.target.checked ? [...prev, t.id] : prev.filter((d) => d !== t.id)
                    )
                  }
                  className="accent-accent"
                />
                <span className="font-mono text-accent">{t.key}</span>
                <span className="truncate text-slate-300">{t.title}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}