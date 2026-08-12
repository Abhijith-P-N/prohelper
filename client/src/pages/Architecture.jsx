import { motion } from 'framer-motion'
import { Network, ArrowDown, Layers, Monitor, Server, Lock, Database, FileUp, FileDown, ShieldCheck } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { EmptyBlock } from '../components/ui/States'
import { Users } from 'lucide-react'

function Node({ member, title, icon: Icon, lip, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 panel w-full max-w-md p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5" style={{ background: `${accent}1a`, color: accent }}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[11px] text-slate-500">{member ? `${member.name} · ${member.role}` : 'No member assigned yet'}</p>
        </div>
        {member && <Avatar name={member.name} color={member.color} size={32} />}
      </div>
      {lip && <p className="mt-2 font-mono text-[10px] tracking-wider text-slate-600">{lip}</p>}
    </motion.div>
  )
}

function ArrowNode({ label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center py-1 text-slate-500"
    >
      <ArrowDown size={18} className="animate-bounce" />
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest">{label}</span>
    </motion.div>
  )
}

export default function Architecture() {
  const { db } = useWorkspace()
  const find = (rolePart) => db.teamMembers.find((m) => m.role.includes(rolePart)) || null
  const haroon = find('Frontend')
  const azin = find('Backend')
  const adhil = find('Security')
  const abhi = find('Database') || find('DevOps')

  return (
    <div>
      <SectionHeader
        title="Architecture"
        subtitle="Graphical view of the team streams and the request pipeline they co-own."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Team flow */}
        <Card>
          <Card.Header icon={Network} title="Team architecture" subtitle="Feature branches feed develop → main" />
          <Card.Body>
            {db.teamMembers.length === 0 ? (
              <EmptyBlock
                icon={Users}
                title="Add your team to map the architecture"
                description="Once members exist, this diagram maps the real stream ownership: Frontend → Backend → Security + Database."
              />
            ) : (
              <div className="mesh-bg mx-auto flex max-w-2xl flex-col items-center rounded-xl border border-white/5 p-4">
              <div className="flex flex-col items-center">
                <Node member={haroon} title="Frontend · React / Vite" icon={Monitor} lip={haroon?.branch || 'branch / frontend'} accent="#4ea3ff" />
                <ArrowNode label="consumes REST" delay={0.1} />
                <Node member={azin} title="Backend · Express API" icon={Server} lip={azin?.branch || 'branch / backend'} accent="#a78bfa" />
              </div>

              <div className="mt-2 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                <div className="flex flex-col items-center">
                  <ArrowNode label="called by" delay={0.2} />
                  <Node member={adhil} title="Security & Encryption" icon={Lock} lip={adhil?.branch || 'AES-256-GCM · SHA-256 · tokens'} accent="#00d4a8" />
                </div>
                <div className="flex flex-col items-center">
                  <ArrowNode label="reads / writes" delay={0.3} />
                  <Node member={abhi} title="Database · Storage · DevOps" icon={Database} lip={abhi?.branch || 'Supabase · blobs · Docker'} accent="#f5a524" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck size={12} className="text-accent" /> RLS everywhere · no plaintext at rest · audit trail on every hop
              </div>
            </div>
            )}
          </Card.Body>
        </Card>

        {/* Pipeline */}
        <Card>
          <Card.Header icon={Layers} title="Upload / download pipeline" subtitle="The encryption-first data path" />
          <Card.Body>
            <div className="space-y-3">
              {[
                { icon: FileUp, t: '1 · Upload', d: 'Multipart stream → per-file AES key generated', c: '#a78bfa' },
                { icon: Lock, t: '2 · Encrypt', d: 'AES-256-GCM envelope: IV ‖ authTag ‖ ciphertext', c: '#00d4a8' },
                { icon: ShieldCheck, t: '3 · Fingerprint', d: 'SHA-256 hash of plaintext → stored with envelope', c: '#4ea3ff' },
                { icon: Database, t: '4 · Store', d: 'Ciphertext blob → object storage; metadata → Postgres', c: '#f5a524' },
                { icon: FileDown, t: '5 · Deliver', d: 'Share/owner gate → decrypt → verify hash → stream', c: '#f44f5e' },
              ].map((s, i) => (
                <motion.div
                  key={s.t}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-base-900/50 p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: `${s.c}1a`, color: s.c }}>
                    <s.icon size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{s.t}</p>
                    <p className="text-[11px] leading-relaxed text-slate-500">{s.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Dependency note */}
      <Card className="mt-4">
        <Card.Header title="Why the board blocks what it blocks" subtitle="Stream dependencies encoded as task dependencies" />
        <Card.Body>
          <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-white/5 bg-base-900/40 p-3">
              <p className="font-semibold text-slate-200">Upload UI <span className="text-slate-500">(Frontend)</span></p>
              <p className="mt-1 text-[11px] text-slate-500">depends on <span className="text-accent">Upload API</span> (Backend) → <span className="text-accent">Storage</span> (DB/DevOps)</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-base-900/40 p-3">
              <p className="font-semibold text-slate-200">Encryption <span className="text-slate-500">(Security)</span></p>
              <p className="mt-1 text-[11px] text-slate-500">integrates with <span className="text-accent">Upload API</span> (Backend) then <span className="text-accent">Encrypted storage</span> (DB/DevOps)</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-base-900/40 p-3">
              <p className="font-semibold text-slate-200">Share UI <span className="text-slate-500">(Frontend)</span></p>
              <p className="mt-1 text-[11px] text-slate-500">needs <span className="text-accent">Share API</span> (Backend) + <span className="text-accent">AES-256-GCM</span> (Security) before it can ship</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}