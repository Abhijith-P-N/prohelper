import { useState } from 'react'
import { Users, GitFork, UserPlus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { MemberCard, StreamDeps } from '../components/team/MemberCard'
import { Modal } from '../components/ui/Modal'
import { EmptyBlock } from '../components/ui/States'
import { memberStats } from '../lib/utils'

const DEFAULT_COLORS = ['#4ea3ff', '#a78bfa', '#00d4a8', '#f5a524', '#f44f5e', '#34d399']

export default function Team() {
  const { db, addMember, updateMember, deleteMember } = useWorkspace()
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({ name: '', role: 'Developer', branch: '', color: DEFAULT_COLORS[0] })

  const aggregate = Object.values(memberStats(db)).reduce((a, s) => a + s.progress, 0)

  const submitAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    setBusy(true)
    try {
      await addMember({
        name: form.name.trim(),
        role: form.role.trim(),
        branch: form.branch.trim(),
        color: form.color,
      })
      toast.success(`Added ${form.name} to the team`)
      setForm({ name: '', role: 'Developer', branch: '', color: DEFAULT_COLORS[0] })
      setShowAdd(false)
    } catch (err) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    setBusy(true)
    try {
      await updateMember(edit.id, { name: edit.name, role: edit.role, branch: edit.branch, color: edit.color })
      toast.success('Member updated')
      setEdit(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update member')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the team? Their tasks stay but become unassigned.`)) return
    try {
      await deleteMember(m.id)
      toast.success(`${m.name} removed`)
    } catch (err) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  return (
    <div>
      <SectionHeader
        title="Team"
        subtitle="Everyone working the board. Add real people, assign roles and branches."
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <UserPlus size={15} /> Add member
          </button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4 text-center">
          <p className="font-mono text-[10px] tracking-widest text-slate-500">MEMBERS</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{db.teamMembers.length}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="font-mono text-[10px] tracking-widest text-slate-500">TASKS SHIPPED</p>
          <p className="mt-1 text-2xl font-extrabold text-accent">{db.tasks.filter((t) => t.status === 'done').length}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="font-mono text-[10px] tracking-widest text-slate-500">TEAM AVG PROGRESS</p>
          <p className="mt-1 text-2xl font-extrabold text-info">{db.teamMembers.length ? Math.round(aggregate / db.teamMembers.length) : 0}%</p>
        </div>
      </div>

      {db.teamMembers.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {db.teamMembers.map((m, i) => (
            <div key={m.id} className="relative">
              <MemberCard member={m} index={i} />
              <div className="absolute right-3 top-3 flex gap-1.5">
                <button
                  onClick={() => setEdit({ id: m.id, name: m.name, role: m.role, branch: m.branch, color: m.color })}
                  className="rounded-md border border-white/10 bg-base-800/80 p-1.5 text-slate-400 transition hover:border-accent/40 hover:text-accent"
                  aria-label={`Edit ${m.name}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove(m)}
                  className="rounded-md border border-white/10 bg-base-800/80 p-1.5 text-slate-400 transition hover:border-danger/40 hover:text-danger"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyBlock
          icon={Users}
          title="No team members yet"
          description="Add your first real team member — name, role and git branch are all they need to start owning tasks."
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><UserPlus size={15} /> Add member</button>}
        />
      )}

      <div className="mt-5">
        <Card>
          <Card.Header icon={GitFork} title="Cross-stream dependencies" subtitle="How your team's streams depend on each other" />
          <Card.Body>
            <StreamDeps />
          </Card.Body>
        </Card>
      </div>

      {/* Add member */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add team member" subtitle="They'll show on the board, chat and task assignments.">
        <form onSubmit={submitAdd} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ada Lovelace" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Backend & API" />
            </div>
            <div>
              <label className="label">Git branch</label>
              <input className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="feature/your-work" />
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-base-850' : ''}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy && <Loader2 size={15} className="animate-spin" />}
            Add to team
          </button>
        </form>
      </Modal>

      {/* Edit member */}
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title="Edit team member" subtitle={edit?.name}>
        <div className="space-y-4">
          {edit && (
            <>
              <div>
                <label className="label">Name</label>
                <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <input className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} />
                </div>
                <div>
                  <label className="label">Git branch</label>
                  <input className="input" value={edit.branch} onChange={(e) => setEdit({ ...edit, branch: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEdit({ ...edit, color: c })}
                      className={`h-7 w-7 rounded-full transition ${edit.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-base-850' : ''}`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
                <button className="btn-primary" onClick={saveEdit} disabled={busy}>
                  {busy && <Loader2 size={15} className="animate-spin" />} Save changes
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}