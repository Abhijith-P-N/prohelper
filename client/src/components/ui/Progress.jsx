import { motion } from 'framer-motion'

export function ProgressBar({ value, color = 'bg-accent', height = 6, className = '' }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/5 ${className}`} style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 5, color = '#00d4a8', label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * v) / 100 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-slate-100">{label ?? `${Math.round(v)}%`}</span>
    </div>
  )
}