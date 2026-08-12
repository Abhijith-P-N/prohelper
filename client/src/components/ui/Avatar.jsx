export function Avatar({ name, color = '#4ea3ff', size = 32 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-base-950"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${color}, ${color}99)` }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

export function StatusDot({ color = 'bg-emerald-400' }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
}