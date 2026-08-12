import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Lock, KeyRound, FileCode2, Users, Map,
  FolderLock, DownloadCloud, Fingerprint,
  ArrowRight, Github, Twitter, Linkedin,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { currentDay, currentWeek } from '../lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

const FEATURES = [
  { icon: FolderLock, title: 'Encrypted delivery', text: 'AES-256-GCM for every upload. SHA-256 fingerprints on every download. Nothing stored in plaintext.' },
  { icon: KeyRound, title: 'Share controls', text: 'Passwords, expiration windows and download limits per share — revoked instantly from the dashboard.' },
  { icon: Fingerprint, title: 'Token security', text: 'Share secrets are only ever stored as digests. Constant-time compares, masked 404s, no enumeration.' },
  { icon: Shield, title: 'Audited access', text: 'Every upload, download and denied attempt lands in an owner-scoped access log.' },
]

const SPRINT = [
  { week: 1, title: 'Prototype', desc: 'Auth + upload/download loop, schema, storage, encryption architecture.', w: '03→09 Aug' },
  { week: 2, title: 'Security', desc: 'AES-256-GCM, share controls, hardened tokens, revocation, audit logs.', w: '10→16 Aug' },
  { week: 3, title: 'Finalization', desc: 'Pentest, threat model, hardening, HTTPS + Docker production.', w: '17→23 Aug' },
]

export default function Landing() {
  const { user } = useAuth()
  const week = currentWeek()
  const day = currentDay()
  const path = user ? '/app/dashboard' : '/login'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mesh-bg absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px]" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim shadow-glow">
            <Shield size={18} className="text-base-950" strokeWidth={2.5} />
          </span>
          <span className="text-base font-extrabold tracking-tight text-white">
            Secure<span className="text-accent">Sync</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip hidden border-white/10 bg-white/[0.03] text-slate-400 sm:inline-flex">
            <Map size={12} /> Week {week} · Day {day}
          </span>
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/login" className="btn-primary">Open workspace</Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp} className="chip mb-5 border-accent/25 bg-accent/10 text-accent">
              <Lock size={12} />
              Secure File Sharing Platform · Sprint Ops
            </motion.div>
            <motion.h1
              initial="hidden" animate="show" custom={1} variants={fadeUp}
              className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl"
            >
              Where the team builds{' '}
              <span className="text-glow bg-gradient-to-r from-accent-bright to-accent bg-clip-text text-transparent">
                encrypted file sharing
              </span>
            </motion.h1>
            <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp} className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
              SecureSync is the operations dashboard for a 4-person security team shipping a
              privacy-first platform: tasks, architecture, API contract, security tests, AI prompts
              and git workflow in one encrypted command center.
            </motion.p>
            <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link to={path} className="btn-primary">
                Launch dashboard <ArrowRight size={16} />
              </Link>
              <Link to="/app/roadmap" className="btn-ghost">View 3-week roadmap</Link>
            </motion.div>
            <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp} className="mt-8 flex flex-wrap gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-accent" /> AES-256-GCM</span>
              <span className="flex items-center gap-1.5"><Fingerprint size={13} className="text-accent" /> SHA-256 integrity</span>
              <span className="flex items-center gap-1.5"><DownloadCloud size={13} className="text-accent" /> Controlled shares</span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative">
            <div className="panel relative overflow-hidden p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">WEEK 2 · SECURITY PHASE</p>
                  <p className="font-mono text-[10px] text-slate-500">sprint-day {day}/21 · live sync</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> SECURE
                </span>
              </div>
              <div className="space-y-3 pt-3">
                {[
                  { k: 'Upload → encrypt → store', v: 'AES-256-GCM envelope', ok: true },
                  { k: 'Share token resolved', v: 'digest-at-rest verified', ok: true },
                  { k: 'Downloads remaining', v: '12 / 20 · limit enforced', ok: true },
                  { k: 'SHA-256 fingerprint', v: 'b7e4…9f21 matched', ok: false },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between rounded-lg border border-white/5 bg-base-900/60 px-3 py-2">
                    <p className="text-xs font-medium text-slate-300">{row.k}</p>
                    <span className="flex items-center gap-2">
                      <code className="font-mono text-[10px] text-slate-500">{row.v}</code>
                      {row.ok ? <Shield size={13} className="text-accent" /> : <FileCode2 size={13} className="text-warn" />}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-24 overflow-hidden rounded-lg border border-white/5 bg-base-900/60">
                <div className="animate-scan h-0.5 w-full bg-gradient-to-r from-transparent via-accent to-transparent" />
                <div className="space-y-1.5 p-4 font-mono text-[10px] text-slate-500">
                  <p><span className="text-accent">✔</span> POST /shares 201 · token issued</p>
                  <p><span className="text-accent">✔</span> GET /files/:id 200 · owner verified</p>
                  <p><span className="text-warn">✖</span> attempt /files/99 403 · forbidden</p>
                  <p><span className="text-accent">▸</span> audit access_logs inserted</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 -z-10 h-40 w-40 rounded-full bg-accent/20 blur-[70px]" />
          </motion.div>
        </section>

        <section className="py-12">
          <h2 className="text-center text-2xl font-bold text-white">Built for the threat, not for show</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Every feature maps to a requirement in PROJECT_SPEC.md. The board, the code and the tests agree.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} variants={fadeUp} className="panel panel-hover p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-3 text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="panel overflow-hidden">
            <div className="grid md:grid-cols-3">
              {SPRINT.map((s) => (
                <div key={s.week} className="border-white/5 p-6 md:border-r last:border-r-0">
                  <span className="chip mb-3 border-accent/25 bg-accent/10 text-accent">WEEK {s.week}</span>
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.desc}</p>
                  <p className="mt-3 font-mono text-[10px] tracking-widest text-slate-600">{s.w}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 text-center">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-2xl font-bold text-white">
            One team. One source of truth. Zero plaintext.
          </motion.h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
            Haroon, Azin, Adhil and Abhi run the whole build from here — tasks, architecture, API,
            security tests and AI prompts in lockstep.
          </p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <Link to="https://github.com" target="_blank" rel="noreferrer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-accent/40 hover:text-accent"><Github size={18} /></Link>
            <Link to="https://twitter.com" target="_blank" rel="noreferrer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-accent/40 hover:text-accent"><Twitter size={18} /></Link>
            <Link to="https://linkedin.com" target="_blank" rel="noreferrer" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-accent/40 hover:text-accent"><Linkedin size={18} /></Link>
          </div>
          <div className="mt-10 flex justify-center">
            <Link to={path} className="btn-primary">Enter the command center <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-600">
          <p className="font-mono tracking-widest">SECURESYNC · AES-256-GCM · SHA-256 · RLS</p>
          <p className="flex items-center gap-1.5"><Users size={12} /> Haroon · Azin · Adhil · Abhi</p>
        </div>
      </footer>
    </div>
  )
}