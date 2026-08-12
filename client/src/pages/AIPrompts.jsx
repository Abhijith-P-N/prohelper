import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Wand2, Search } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'
import { PromptCard } from '../components/prompts/PromptCard'

export default function AIPrompts() {
  const { db } = useWorkspace()
  const [memberFilter, setMemberFilter] = useState('all')
  const [weekFilter, setWeekFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState('all')
  const [query, setQuery] = useState('')

  const prompts = useMemo(
    () =>
      db.prompts.filter((p) => {
        if (memberFilter !== 'all' && p.memberId !== memberFilter) return false
        if (weekFilter !== 'all' && p.week !== Number(weekFilter)) return false
        if (taskFilter !== 'all' && p.taskId !== taskFilter) return false
        if (query && !`${p.title} ${p.prompt}`.toLowerCase().includes(query.toLowerCase())) return false
        return true
      }),
    [db.prompts, memberFilter, weekFilter, taskFilter, query]
  )

  return (
    <div>
      <SectionHeader
        title="AI Prompts"
        subtitle="Coding prompts grounded in PROJECT_SPEC.md, team architecture, the API contract and dependencies."
        action={
          <Link to="/app/prompt-generator" className="btn-primary">
            <Wand2 size={15} /> Open Prompt Generator
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input w-56 pl-9" placeholder="Search prompts…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input w-40" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} aria-label="Member">
          <option value="all">All members</option>
          {db.teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="input w-36" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)} aria-label="Week">
          <option value="all">All weeks</option>
          {[1, 2, 3].map((w) => <option key={w} value={w}>Week {w}</option>)}
        </select>
        <select className="input w-52" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} aria-label="Task">
          <option value="all">Linked to any task</option>
          {db.tasks.map((t) => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
        </select>
        <span className="ml-auto text-[11px] text-slate-500">{prompts.length} prompt{prompts.length === 1 ? '' : 's'}</span>
      </div>

      {prompts.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {prompts.map((p, i) => (
            <PromptCard key={p.id} prompt={p} index={i} />
          ))}
        </div>
      ) : (
        <EmptyBlock
          icon={Sparkles}
          title="No prompts found"
          description="Change the filters or generate a fresh prompt wired to a task, member and week."
          action={<Link to="/app/prompt-generator" className="btn-primary"><Wand2 size={15} /> Prompt Generator</Link>}
        />
      )}
    </div>
  )
}