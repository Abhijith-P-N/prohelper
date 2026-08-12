import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, FileText, ListTree } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { SectionHeader } from '../components/ui/Card'
import { EmptyBlock } from '../components/ui/States'

export default function Documentation() {
  const { db } = useWorkspace()
  const [active, setActive] = useState(db.documents[0]?.section || 'overview')
  const doc = db.documents.find((d) => d.section === active)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [active])

  return (
    <div>
      <SectionHeader
        title="Documentation"
        subtitle="The living runbook for the Secure File Sharing Platform — specs, schemas and runbooks."
      />

      {db.documents.length ? (
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Table of contents */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-3">
            <p className="mb-2 flex items-center gap-2 px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              <ListTree size={12} /> Sections
            </p>
            <nav className="space-y-0.5">
              {db.documents.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActive(d.section)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active === d.section
                      ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(0,212,168,0.2)]'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <FileText size={13} className={active === d.section ? 'text-accent' : 'text-slate-600'} />
                  <span className="capitalize">{d.title}</span>
                </button>
              ))}
            </nav>
            <div className="mt-3 rounded-lg border border-accent/15 bg-accent/[0.04] p-3 text-[10px] leading-relaxed text-slate-400">
              <p className="font-semibold text-accent">Single source of truth</p>
              <p className="mt-1">Every generated AI prompt pulls its context from PROJECT_SPEC.md — mirror this doc in the repo root.</p>
            </div>
          </div>
        </aside>

        {/* Doc body */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-6"
        >
          {doc ? (
            <>
              <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">{doc.title}</h2>
                  <p className="font-mono text-[10px] tracking-widest text-slate-600">SECTION · {doc.section.toUpperCase()}</p>
                </div>
              </div>
              <div className="prose-slate space-y-3">
                {doc.content.map((block, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-slate-300">{block}</p>
                ))}
              </div>
            </>
          ) : (
            <EmptyBlock icon={BookOpen} title="Select a section" description="Pick a documentation section from the left to read it here." />
          )}
        </motion.div>
      </div>
      ) : (
        <EmptyBlock icon={BookOpen} title="No documentation yet" description="Publish your runbook sections here — overview, architecture, API, security, and more." />
      )}
    </div>
  )
}