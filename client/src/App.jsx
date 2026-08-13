import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/layout/AppShell'
import { LoadingBlock, ErrorBlock } from './components/ui/States'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyTasks from './pages/MyTasks'
import Team from './pages/Team'
import AIPrompts from './pages/AIPrompts'
import PromptGenerator from './pages/PromptGenerator'
import Roadmap from './pages/Roadmap'
import Architecture from './pages/Architecture'
import ApiContract from './pages/ApiContract'
import GitWorkflow from './pages/GitWorkflow'
import SecurityTesting from './pages/SecurityTesting'
import Documentation from './pages/Documentation'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function RequireAuth() {
  const { user, initializing } = useAuth()
  const { ready, error, reload } = useWorkspace()
  if (initializing) return <div className="p-8"><LoadingBlock label="Restoring session…" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!ready) return <div className="p-8"><LoadingBlock label="Syncing workspace with Supabase…" /></div>
  if (error) {
    return (
      <div className="p-8">
        <ErrorBlock message={error} onRetry={() => reload()} />
      </div>
    )
  }
  return <AppShell />
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<RequireAuth />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="team" element={<Team />} />
              <Route path="prompts" element={<AIPrompts />} />
              <Route path="prompt-generator" element={<PromptGenerator />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="architecture" element={<Architecture />} />
              <Route path="api" element={<ApiContract />} />
              <Route path="git" element={<GitWorkflow />} />
              <Route path="security" element={<SecurityTesting />} />
              <Route path="docs" element={<Documentation />} />
              <Route path="chat" element={<Chat />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export { LoadingBlock }