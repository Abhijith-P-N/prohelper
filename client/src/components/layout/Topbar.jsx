import { Menu, CalendarDays, Shield, ServerCog, Wifi } from 'lucide-react'
import { NAV } from '../../lib/constants'
import { currentDay, currentWeek } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'

export function Topbar({ onMenu }) {
  const { pathname } = window.location
  const match = NAV.find((n) => pathname.startsWith(n.to) && n.to !== '/')
  const { configured } = useAuth()
  const { db } = useWorkspace()
  const week = currentWeek()
  const day = currentDay()
  const w = db.roadmap.find((r) => r.week === week)

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-base-950/80 px-4 py-3 backdrop-blur-lg lg:px-6">
      <button onClick={onMenu} className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 lg:hidden">
        <Menu size={18} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{match?.label || 'SecureSync'}</p>
        <p className="hidden truncate font-mono text-[10px] tracking-wider text-slate-500 sm:block">
          secure-file-sharing / {db.project.name}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="chip hidden border-accent/25 bg-accent/10 text-accent md:inline-flex">
          <CalendarDays size={12} />
          Week {week} · Day {day}/21
        </span>
        <span className="chip hidden border-white/10 bg-white/[0.03] text-slate-400 sm:inline-flex">
          <Shield size={12} className="text-accent" />
          {w?.theme || 'Prototype'}
        </span>
        <span className="chip hidden border-white/10 bg-white/[0.03] text-slate-400 lg:inline-flex">
          {configured ? <Wifi size={12} className="text-accent" /> : <ServerCog size={12} />}
          {configured ? 'supabase live' : 'not configured'}
        </span>
        <span className="relative flex items-center">
          <Wifi size={13} className="text-accent" />
          <span className="absolute right-0 top-0 h-1.5 w-1.5 -translate-y-1 animate-pulse rounded-full bg-accent" />
        </span>
      </div>
    </header>
  )
}