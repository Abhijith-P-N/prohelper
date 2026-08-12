import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCheck, Save, RefreshCw, Trash2, Pencil, Sparkles } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useToast } from '../../context/ToastContext'
import { memberById, taskById } from '../../lib/utils'
import { buildPrompt } from '../../lib/promptTemplates'
import { Avatar } from '../ui/Avatar'
import { CopyButton } from '../ui/Badges'
import { WEEKS } from '../tasks/taskOptions'

export function PromptCard({ prompt, index }) {
  const { db, savePrompt, deletePrompt } = useWorkspace()
  const toast = useToast()
  const member = memberById(db.teamMembers, prompt.memberId)
  const task = taskById(db.tasks, prompt.taskId)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(prompt)

  const startEdit = () => {
    setDraft(prompt)
    setEditing(true)
  }

  const saveEdit = async () => {
    try {
      await savePrompt({ ...draft, id: prompt.id, memberId: draft.memberId || null })
      setEditing(false)
      toast.success('Prompt saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save prompt')
    }
  }

  const regenerate = async () => {
    setBusy(true)
    try {
      const fresh = buildPrompt({
        data: db,
        memberId: prompt.memberId,
        taskId: prompt.taskId,
        role: member?.role,
        week: prompt.week,
        technology: draft.technology,
        aiTool: prompt.aiTool,
      })
      await savePrompt({ ...prompt, id: prompt.id, prompt: fresh, saved: true })
      setDraft((d) => ({ ...d, prompt: fresh }))
      toast.success('Prompt regenerated from PROJECT_SPEC.md context')
    } catch (err) {
      toast.error(err.message || 'Regeneration failed')
    } finally {
      setBusy(false)
    }
  }

  const toggleSave = async () => {
    const next = !prompt.saved
    try {
      await savePrompt({ ...prompt, id: prompt.id, saved: next })
      toast.info(next ? 'Prompt saved to library' : 'Prompt unsaved')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="panel flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          {member && <Avatar name={member.name} color={member.color} size={34} />}
          <div>
            <p className="text-sm font-bold text-white">{draft.title || prompt.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">{member?.name}</span>
              <span>·</span>
              <span>{({ 1: 'Week 1', 2: 'Week 2', 3: 'Week 3' })[prompt.week]}</span>
              {task && (<><span>·</span><span className="font-mono text-accent">{task.key} {task.title}</span></>)}
              <span>·</span>
              <span className="text-slate-400">{prompt.aiTool}</span>
            </p>
          </div>
        </div>
        <span className={`chip ${prompt.saved ? 'border-accent/30 bg-accent/10 text-accent' : 'border-white/10 bg-white/[0.03] text-slate-500'}`}>
          {prompt.saved ? <CheckCheck size={11} /> : <Sparkles size={11} />}
          {prompt.saved ? 'SAVED' : 'DRAFT'}
        </span>
      </div>

      <div className="flex-1 p-4">
        {editing ? (
          <div className="space-y-3">
            <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Prompt title" />
            <div className="grid gap-2 sm:grid-cols-3">
              <select className="input" value={draft.memberId} onChange={(e) => setDraft({ ...draft, memberId: e.target.value })}>
                {db.teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select className="input" value={draft.week} onChange={(e) => setDraft({ ...draft, week: Number(e.target.value) })}>
                {WEEKS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
              <select className="input" value={draft.taskId} onChange={(e) => setDraft({ ...draft, taskId: e.target.value })}>
                <option value="">No linked task</option>
                {db.tasks.map((t) => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
              </select>
            </div>
            <textarea className="input min-h-[240px] font-mono text-xs" value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} />
          </div>
        ) : (
          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/5 bg-base-900/60 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
            {prompt.prompt}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 p-3">
        <CopyButton text={prompt.prompt} />
        {editing ? (
          <>
            <button className="btn-ghost text-xs" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary ml-auto text-xs" onClick={saveEdit}><Save size={13} /> Save</button>
          </>
        ) : (
          <>
            <button className="btn-ghost text-xs" onClick={startEdit}><Pencil size={13} /> Edit</button>
            <button className="btn-ghost text-xs" onClick={regenerate} disabled={busy}>
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> {busy ? 'Regenerating' : 'Regenerate'}
            </button>
            <button className="btn-ghost text-xs" onClick={toggleSave}>
              <Save size={13} /> {prompt.saved ? 'Unsave' : 'Save'}
            </button>
            <button
              className="btn-danger ml-auto !py-1 text-xs"
              onClick={async () => { if (window.confirm('Delete this prompt?')) { try { await deletePrompt(prompt.id); toast.success('Prompt deleted') } catch (err) { toast.error(err.message || 'Delete failed') } } }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}