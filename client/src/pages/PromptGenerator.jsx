import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, RefreshCw, Save, Pencil, Check } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { CopyButton } from '../components/ui/Badges'
import { buildPrompt } from '../lib/promptTemplates'
import { AUTHORS } from '../lib/constants'
import { WEEKS } from '../components/tasks/taskOptions'

export default function PromptGenerator() {
  const { db, savePrompt } = useWorkspace()
  const toast = useToast()

  const firstMember = db.currentMember?.id || db.teamMembers[0]?.id || ''

  const [inputs, setInputs] = useState({
    memberId: firstMember,
    name: db.currentMember?.name || '',
    role: db.currentMember?.role || 'Developer',
    branch: db.currentMember?.branch || '',
    week: 1,
    taskId: '',
    technology: '',
    aiTool: AUTHORS[0],
  })
  const [editing, setEditing] = useState(false)
  const [output, setOutput] = useState('')
  const [generated, setGenerated] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setInputs((prev) => {
    const next = { ...prev, [k]: e.target.value }
    if (k === 'memberId') {
      const m = db.teamMembers.find((x) => x.id === e.target.value)
      if (m) { next.name = m.name; next.role = m.role; next.branch = m.branch }
    }
    return next
  })

  const prompt = useMemo(
    () => buildPrompt({ data: db, ...inputs }),
    [inputs, db]
  )

  const generate = () => {
    if (!inputs.name.trim() && !inputs.role.trim()) return toast.error('Enter a member name or role first')
    setBusy(true)
    setTimeout(() => {
      setOutput(prompt)
      setGenerated(true)
      setBusy(false)
      toast.success('Prompt generated from live workspace context')
    }, 500)
  }

  const save = async () => {
    if (!output) return toast.error('Generate a prompt before saving')
    const task = db.tasks.find((x) => x.id === inputs.taskId)
    try {
      await savePrompt({
        memberId: inputs.memberId || null,
        taskId: task ? inputs.taskId : null,
        week: Number(inputs.week),
        title: task ? `${task.key} — ${task.title}` : `Prompt · ${inputs.name || inputs.role}`,
        aiTool: inputs.aiTool,
        saved: true,
        prompt: output,
      })
      toast.success('Prompt saved to AI Prompts library')
    } catch (err) {
      toast.error(err.message || 'Failed to save prompt')
    }
  }

  const regenVariation = () => {
    if (!output) return
    setBusy(true)
    setTimeout(() => {
      setOutput(buildPrompt({ data: db, ...inputs }) + '\n\nAPPROACH VARIATION: implement without touching the shared crypto module; wrap it behind the existing auth middleware instead. Highlight the trade-offs.')
      setBusy(false)
      toast.success('Variation regenerated')
    }, 500)
  }

  return (
    <div>
      <SectionHeader
        title="Prompt Generator"
        subtitle="Turn a task, member and week into a production-ready AI coding prompt grounded in PROJECT_SPEC.md and live workspace data."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent"><Wand2 size={15} /></span>
            <div>
              <p className="text-sm font-bold text-white">Prompt inputs</p>
              <p className="text-[11px] text-slate-500">Everything gets baked into the context block.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Member</label>
              <select className="input" value={inputs.memberId} onChange={set('memberId')}>
                <option value="">Custom / unassigned</option>
                {db.teamMembers.map((mm) => (
                  <option key={mm.id} value={mm.id}>{mm.name} — {mm.role}</option>
                ))}
              </select>
              {!db.teamMembers.length && (
                <p className="mt-1 text-[11px] text-slate-600">
                  No team members yet — add them on the Team page, or fill in name/role below.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={inputs.name} onChange={set('name')} placeholder="Member name" />
              </div>
              <div>
                <label className="label">Branch</label>
                <input className="input" value={inputs.branch} onChange={set('branch')} placeholder="feature/your-work" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Role</label>
                <input className="input" value={inputs.role} onChange={set('role')} />
              </div>
              <div>
                <label className="label">Week</label>
                <select className="input" value={inputs.week} onChange={set('week')}>
                  {WEEKS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Linked task</label>
              <select className="input" value={inputs.taskId} onChange={set('taskId')}>
                <option value="">None — custom goal</option>
                {db.tasks.map((t) => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Technology stack</label>
              <input className="input" value={inputs.technology} onChange={set('technology')} placeholder="e.g. Backend · Node / Express / crypto" />
            </div>
            <div>
              <label className="label">AI coding tool</label>
              <select className="input" value={inputs.aiTool} onChange={set('aiTool')}>
                {AUTHORS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="rounded-lg border border-white/5 bg-base-900/50 p-3 text-[11px] leading-relaxed text-slate-500">
              The generated prompt always references <span className="font-semibold text-accent">PROJECT_SPEC.md</span>,
              the <span className="font-semibold text-accent">team architecture</span>, the{' '}
              <span className="font-semibold text-accent">API contract</span> and relevant{' '}
              <span className="font-semibold text-accent">dependencies</span> — pulled from your live workspace board.
            </div>

            <button className="btn-primary w-full" onClick={generate} disabled={busy}>
              {busy ? <RefreshCw size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {busy ? 'Composing context…' : 'Generate detailed prompt'}
            </button>
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div>
              <p className="text-sm font-bold text-white">Generated output</p>
              <p className="text-[11px] text-slate-500">Copy it straight into your AI tool.</p>
            </div>
            <span className={`chip ${generated ? 'border-accent/30 bg-accent/10 text-accent' : 'border-white/10 text-slate-500'}`}>
              {generated ? 'READY' : 'EMPTY'}
            </span>
          </div>

          <div className="flex-1 p-4">
            {!generated && !output ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-slate-600">
                <Wand2 size={26} />
                <p className="text-xs">Fill the inputs and hit Generate to see the prompt here.</p>
              </div>
            ) : editing ? (
              <textarea
                className="input min-h-[420px] font-mono text-xs leading-relaxed"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
              />
            ) : (
              <pre className="max-h-[560px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-base-900/60 p-4 font-mono text-[11px] leading-relaxed text-slate-400">
                {output}
              </pre>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 p-3">
            <CopyButton text={output} label={output ? 'Copy prompt' : 'Copy'} />
            <button className="btn-ghost" onClick={regenVariation} disabled={!output || busy}>
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Regenerate
            </button>
            <button className="btn-ghost" onClick={() => setEditing((e) => !e)}>
              {editing ? <Check size={14} /> : <Pencil size={14} />} {editing ? 'Done editing' : 'Edit'}
            </button>
            <button className="btn-primary ml-auto" onClick={save} disabled={!output}>
              <Save size={14} /> Save to library
            </button>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="panel mt-4 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Context contract</p>
        <div className="flex flex-wrap gap-2">
          {['PROJECT_SPEC.md (§6 deps, §7 crypto)', 'Team architecture (§4)', 'API contract (§5)', `W${inputs.week} phase`, 'No-secrets rule'].map((tag) => (
            <span key={tag} className="chip border-white/10 bg-white/[0.03] text-slate-400"><Check size={11} className="text-accent" /> {tag}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}