import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-white/5 px-6 py-3">
          <p className="font-mono text-[10px] tracking-widest text-slate-600">
            SECURESYNC · ENCRYPTED · AUDITED · 3-WEEK SPRINT
          </p>
        </footer>
      </div>
    </div>
  )
}