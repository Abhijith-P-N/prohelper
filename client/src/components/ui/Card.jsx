import { motion } from 'framer-motion'

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div className={`panel ${hover ? 'panel-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-base-800">
            <Icon size={15} className="text-accent" />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

export function SectionHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold text-white">
          {Icon && <Icon size={20} className="text-accent" />}
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function animated() {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }
}

export function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}