import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoadingBlock({ label = 'Loading…', compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        {label}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-base-850/60 px-6 py-12 text-slate-400">
      <Loader2 size={26} className="animate-spin text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyBlock({ icon: Icon, title = 'Nothing here yet', description = 'There is no data to display in this view yet.', action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-base-850/40 px-6 py-12 text-center"
    >
      {Icon && <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-base-800"><Icon size={20} className="text-slate-500" /></span>}
      <div>
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      </div>
      {action}
    </motion.div>
  )
}

export function ErrorBlock({ message = 'Something went wrong while loading this view.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-danger">{message}</p>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function SuccessBlock({ message = 'Completed successfully.' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
      {message}
    </div>
  )
}