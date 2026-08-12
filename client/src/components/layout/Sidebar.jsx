import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, LogOut, RefreshCcw, X } from 'lucide-react'
import { NAV } from '../../lib/constants'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../ui/Avatar'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim shadow-glow">
        <Shield size={18} className="text-base-950" strokeWidth={2.5} />
      </span>
      <div>
        <p className="text-sm font-extrabold tracking-tight text-white">
          Secure<span className="text-accent">Sync</span>
        </p>
        <p className="font-mono text-[10px] tracking-widest text-slate-500">FILE SHARE OPS</p>
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose }) {
  const { signOut, user } = useAuth()
  const { reload } = useWorkspace()
  const toast = useToast()
  const { db } = useWorkspace()
  const member = db.currentMember

  const refresh = async () => {
    try {
      await reload()
      toast.success('Workspace synced with Supabase')
    } catch {
      toast.error('Sync failed')
    }
    onClose?.()
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-base-900/95 backdrop-blur transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-1 pt-5">
          <Logo />
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 lg:hidden">
            <X size={17} />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV.slice(0, -1).map((item) => item.to === '/' ? null : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(0,212,168,0.25)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'} />
                  {item.label}
                  {isActive && <motion.span layoutId="nav-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-base-800/70 p-2">
            {member ? (
              <>
                <Avatar name={member.name} color={member.color} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">{member.name}</p>
                  <p className="truncate text-[10px] text-slate-500">{member.role || 'Member'}</p>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{user?.email?.split('@')[0] || 'Member'}</p>
                <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
              </div>
            )}
            <button onClick={signOut} title="Sign out" className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-danger/10 hover:text-danger">
              <LogOut size={15} />
            </button>
          </div>
          <button onClick={refresh} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/5 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-white/[0.04]">
            <RefreshCcw size={12} />
            Reload workspace data
          </button>
        </div>
      </aside>
    </>
  )
}