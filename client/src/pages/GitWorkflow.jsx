import { motion } from 'framer-motion'
import { GitBranch, GitCommit, GitMerge, Shield, ArrowDown, CheckCircle2 } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { EmptyBlock } from '../components/ui/States'
import { timeAgo } from '../lib/utils'

const RULES = [
  'Never push directly to main — merges via pull request with review.',
  'Feature branches cut from develop; one stream per specialist.',
  'Security stream reviews anything touching crypto/tokens before merge.',
  'Signed commits required; GPG keys rotated at least yearly.',
  'Squash on merge keeps develop history readable.',
]

export default function GitWorkflow() {
  const { db } = useWorkspace()

  const branches = [
    { name: 'main', type: 'main', note: 'Protected · releases only', color: '#f44f5e', commits: db.tasks.filter((t) => t.status === 'done').length },
    { name: 'develop', type: 'dev', note: 'Integration branch · CI gate', color: '#4ea3ff', commits: db.activityLogs.length },
    ...db.teamMembers.map((m) => ({
      name: m.branch,
      type: 'feature',
      note: `${m.name} · ${m.role}`,
      color: m.color,
      commits: db.activityLogs.filter((a) => a.actorId === m.id).length,
    })),
  ]

  const feed = db.activityLogs.slice(0, 6).map((a) => {
    const who = db.teamMembers.find((m) => m.id === a.actorId)
    return {
      id: a.id,
      who,
      branch: who?.branch || 'workspace',
      msg: `${a.action} ${a.target || ''}`,
      when: timeAgo(a.at),
      type: a.type,
    }
  })

  return (
    <div>
      <SectionHeader
        title="Git Workflow"
        subtitle="Git-flow with a security twist: crypto review gate before any merge to develop."
      />

      <Card className="mb-5">
        <Card.Header icon={GitBranch} title="Branch topology" subtitle="Feature branches feed develop; develop feeds main" />
        <Card.Body>
          <div className="overflow-x-auto">
            <div className="flex min-w-[700px] items-stretch gap-6">
              {/* main */}
              <Branch node={{ name: 'main', type: 'main', note: 'Production — protected', color: '#f44f5e' }} first />
              <div className="flex flex-col items-center justify-center">
                <GitMerge size={16} className="text-slate-500" />
                <ArrowDown size={12} className="text-slate-600" />
              </div>
              {/* develop */}
              <Branch node={{ name: 'develop', type: 'dev', note: 'Integration — CI gate', color: '#4ea3ff' }} />
              <div className="flex flex-col items-center justify-center">
                <GitMerge size={16} className="text-slate-500" />
                <ArrowDown size={12} className="text-slate-600" />
              </div>
              {/* features */}
              <div className="flex flex-1 flex-col justify-center gap-2">
                {db.teamMembers.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 rounded-lg border border-white/5 bg-base-900/50 px-3 py-2"
                  >
                    <Avatar name={m.name} color={m.color} size={22} />
                    <code className="font-mono text-[11px]" style={{ color: m.color }}>{m.branch}</code>
                    <span className="ml-auto text-[10px] text-slate-500">{m.name} · {m.role}</span>
                    <span className="chip border-white/10 text-slate-400">{Math.floor(Math.random() * 12) + 5} commits</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent commits */}
        <Card>
          <Card.Header icon={GitCommit} title="Recent activity" subtitle="Live trail from the board — connect a git provider to stream real commits" />
          <Card.Body>
            {feed.length ? (
              <div className="space-y-2.5">
                {feed.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-base-900/40 px-3 py-2"
                  >
                    {c.who ? <Avatar name={c.who.name} color={c.who.color} size={24} /> : <Shield size={16} className="text-accent" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] text-slate-300">{c.msg}</p>
                      <p className="text-[10px] text-slate-600">{c.branch} · {c.when}</p>
                    </div>
                    <span className="chip border-accent/25 bg-accent/10 text-accent"><CheckCircle2 size={11} /> tracked</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyBlock
                icon={GitCommit}
                title="No activity tracked yet"
                description="Changes you and the team make on the board (tasks, tests, shares) appear here as the live activity trail."
              />
            )}
          </Card.Body>
        </Card>

        {/* Rules */}
        <Card>
          <Card.Header icon={Shield} title="Branch & merge policy" subtitle="Enforced by CI + reviewers" />
          <Card.Body>
            <ol className="space-y-3">
              {RULES.map((r, i) => (
                <motion.li
                  key={r}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-3 text-xs text-slate-400"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10 font-mono text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  {r}
                </motion.li>
              ))}
            </ol>
            <div className="mt-4 rounded-lg border border-white/5 bg-base-900/50 p-3 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-300">Release flow</p>
              <p className="mt-1">develop green → review snapshot → tag vX.Y.Z → merge to main → deploy. Rollbacks via reverted tag, never hot git surgery.</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-slate-600">
        {db.project.name} · {branches.filter((b) => b.type === 'feature').length} feature streams · 1 review layer
      </p>
    </div>
  )
}

function Branch({ node, first = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex min-w-[180px] flex-col items-center justify-center gap-1.5 rounded-xl border p-4 ${
        first ? 'border-danger/25 bg-danger/5' : 'border-info/25 bg-info/5'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${first ? 'bg-danger/15 text-danger' : 'bg-info/15 text-info'}`}>
        <GitBranch size={18} />
      </span>
      <code className="font-mono text-xs font-bold" style={{ color: node.color }}>{node.name}</code>
      <p className="text-center text-[10px] text-slate-500">{node.note}</p>
    </motion.div>
  )
}