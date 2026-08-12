import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, Clock3, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { Ring } from '../components/ui/Progress'
import { memberById } from '../lib/utils'

const STATUS_META = {
  pass: { label: 'PASS', cls: 'border-accent/30 bg-accent/10 text-accent', Icon: ShieldCheck },
  'in-progress': { label: 'IN PROGRESS', cls: 'border-warn/30 bg-warn/10 text-warn', Icon: AlertTriangle },
  pending: { label: 'PENDING', cls: 'border-white/10 bg-white/[0.03] text-slate-500', Icon: Clock3 },
}

export default function SecurityTesting() {
  const { db, updateSecurityTest } = useWorkspace()
  const toast = useToast()
  const [openId, setOpenId] = useState(null)
  const passed = db.securityTests.filter((s) => s.status === 'pass').length
  const active = db.securityTests.filter((s) => s.status === 'in-progress').length
  const pct = Math.round((passed / db.securityTests.length) * 100)

  const cycle = async (s) => {
    const order = { pending: 'in-progress', 'in-progress': 'pass', pass: 'pending' }
    const next = order[s.status]
    try {
      await updateSecurityTest(s.id, {
        status: next,
        tested_on: next === 'pass' ? new Date().toISOString().slice(0, 10) : s.testedOn,
      })
      toast.info(`${s.name} marked ${next.toUpperCase()}`)
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  return (
    <div>
      <SectionHeader
        title="Security Testing"
        subtitle="The vulnerable-path checklist every endpoint is graded against. Status is updated as results land."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="panel flex items-center gap-4 p-5">
          <Ring value={pct} size={84} color="#00d4a8" />
          <div>
            <p className="text-sm font-bold text-white">Checklist coverage</p>
            <p className="text-xs text-slate-500">{passed}/{db.securityTests.length} gates passed</p>
            <p className="mt-1 text-[11px] text-slate-600">{active} currently being exercised</p>
          </div>
        </div>
        <div className="panel flex items-center gap-6 px-5 py-4">
          {db.securityTests.slice(0, 10).map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5" title={s.name}>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  s.status === 'pass' ? 'bg-accent' : s.status === 'in-progress' ? 'bg-warn animate-pulse' : 'bg-slate-700'
                }`}
              />
              <span className="text-[9px] uppercase tracking-wider text-slate-600">{s.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {db.securityTests.map((s, i) => {
          const meta = STATUS_META[s.status]
          const tester = memberById(db.teamMembers, s.testedBy)
          const open = openId === s.id
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`panel cursor-pointer p-4 transition-colors ${open ? 'border-white/10' : ''}`}
              onClick={() => setOpenId(open ? null : s.id)}
            >
              <div className="flex items-center gap-3">
                <span className={`chip ${meta.cls}`}><meta.Icon size={12} /> {meta.label}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.category} · {s.severity.toUpperCase()} RISK</p>
                </div>
                <ChevronDown size={15} className={`ml-auto text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </div>

              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <p className="mt-3 rounded-lg border border-white/5 bg-base-900/50 p-3 text-[11px] leading-relaxed text-slate-400">
                    {s.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {tester && (
                      <span className="chip border-white/10 text-slate-400">tested by {tester.name}</span>
                    )}
                    <span className="chip border-white/10 text-slate-400">due/ran {s.testedOn}</span>
                    <button
                      className={`btn ml-auto text-xs !py-1 ${
                        s.status === 'pass' ? 'btn-ghost' : s.status === 'in-progress' ? 'btn-primary' : 'btn-ghost'
                      }`}
                      onClick={(e) => { e.stopPropagation(); cycle(s) }}
                    >
                      {s.status === 'pass' ? 'Reopen as pending' : s.status === 'in-progress' ? 'Mark passed' : 'Start testing'}
                    </button>
                    {s.status === 'pass' && <meta.Icon size={16} className="text-accent" />}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}