import { MotionConfig, motion } from 'framer-motion'
import { Cable, Shield, Clock, Send } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'

const METHOD_COLOR = {
  GET: 'text-accent border-accent/30 bg-accent/10',
  POST: 'text-info border-info/30 bg-info/10',
  DELETE: 'text-danger border-danger/30 bg-danger/10',
  PUT: 'text-warn border-warn/30 bg-warn/10',
}

export default function ApiContract() {
  const { db } = useWorkspace()

  return (
    <div>
      <SectionHeader
        title="API Contract"
        subtitle="The agreed interface between Haroon's frontend, Azin's server and Adhil's crypto layer."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="panel flex items-center gap-3 p-4">
          <Cable size={18} className="text-accent" />
          <div>
            <p className="text-xs font-semibold text-white">{db.apiEndpoints.length} endpoints</p>
            <p className="text-[11px] text-slate-500">Base URL: /api/v1</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <Shield size={18} className="text-info" />
          <div>
            <p className="text-xs font-semibold text-white">{db.apiEndpoints.filter((e) => e.auth !== 'Public').length} protected routes</p>
            <p className="text-[11px] text-slate-500">Bearer / owner / token scopes</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <Clock size={18} className="text-warn" />
          <div>
            <p className="text-xs font-semibold text-white">429 budget</p>
            <p className="text-[11px] text-slate-500">Auth + share endpoints rate limited (W3)</p>
          </div>
        </div>
      </div>

      <MotionConfig reducedMotion="user">
        {db.apiEndpoints.length ? (
        <Card>
          <Card.Body className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Auth</th>
                    <th className="px-4 py-3">Body / Params</th>
                    <th className="px-4 py-3">Response</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {db.apiEndpoints.map((ep, i) => (
                    <motion.tr
                      key={ep.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 align-top hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className={`chip ${METHOD_COLOR[ep.method] || METHOD_COLOR.GET}`}>{ep.method}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-200">{ep.path}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">{ep.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`chip ${ep.auth === 'Public' ? 'border-white/10 text-slate-400' : 'border-warn/25 bg-warn/10 text-warn'}`}>{ep.auth}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{[...(ep.body || []), ...(ep.params || []), ...(ep.query || [])].join(' · ') || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{ep.response}</td>
                      <td className="px-4 py-3">
                        <span className={`chip ${ep.status === 'approved' ? 'border-accent/25 bg-accent/10 text-accent' : 'border-warn/25 bg-warn/10 text-warn'}`}>
                          {ep.status.toUpperCase()}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
        ) : (
          <EmptyBlock icon={Send} title="No endpoints yet" description="Agree and log API endpoints here — they also feed every generated AI prompt's contract block." />
        )}
      </MotionConfig>

      <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-slate-600">
        ERROR SHAPE · {`{ error: { code, message } }`} · NEVER LEAK INTERNALS · 400 / 401 / 403 / 404 / 429 / 413
      </p>
    </div>
  )
}