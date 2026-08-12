import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { STATUS_META, PRIORITY_META } from '../../lib/constants'

export function CopyButton({ text, label = 'Copy', size = 15 }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
        copied
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
      }`}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.todo
  return (
    <span className={`chip ${meta.bg} ${meta.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

export function PriorityPill({ priority }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium
  return <span className={`chip ${meta.color}`}>{meta.label}</span>
}

export function Pill({ children, className = '' }) {
  return <span className={`chip ${className}`}>{children}</span>
}