import {
  LayoutDashboard,
  ListTodo,
  Users,
  Sparkles,
  Wand2,
  Map,
  Network,
  Cable,
  GitBranch,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Settings,
  Home,
} from 'lucide-react'

export const STATUSES = ['todo', 'in-progress', 'review', 'done']

export const STATUS_META = {
  'todo': { label: 'TODO', color: 'text-sky-300', bg: 'bg-sky-400/10 border-sky-400/25', dot: 'bg-sky-400' },
  'in-progress': { label: 'IN PROGRESS', color: 'text-warn', bg: 'bg-warn/10 border-warn/25', dot: 'bg-warn' },
  'review': { label: 'REVIEW', color: 'text-info', bg: 'bg-info/10 border-info/25', dot: 'bg-info' },
  'done': { label: 'DONE', color: 'text-accent', bg: 'bg-accent/10 border-accent/25', dot: 'bg-accent' },
}

export const PRIORITIES = ['low', 'medium', 'high', 'critical']

export const PRIORITY_META = {
  low: { label: 'Low', color: 'text-slate-400 border-white/10' },
  medium: { label: 'Medium', color: 'text-info border-info/25' },
  high: { label: 'High', color: 'text-warn border-warn/25' },
  critical: { label: 'Critical', color: 'text-danger border-danger/25' },
}

export const AUTHORS = ['OpenAI', 'Claude (Copilot)', 'GitHub Copilot', 'Gemini', 'Cursor', 'WebStorm AI Assistant']

export const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/prompts', label: 'AI Prompts', icon: Sparkles },
  { to: '/app/prompt-generator', label: 'Prompt Generator', icon: Wand2 },
  { to: '/app/roadmap', label: 'Roadmap', icon: Map },
  { to: '/app/architecture', label: 'Architecture', icon: Network },
  { to: '/app/api', label: 'API Contract', icon: Cable },
  { to: '/app/git', label: 'Git Workflow', icon: GitBranch },
  { to: '/app/security', label: 'Security Testing', icon: ShieldCheck },
  { to: '/app/docs', label: 'Documentation', icon: BookOpen },
  { to: '/app/chat', label: 'Team Chat', icon: MessageSquare },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/', label: 'Landing', icon: Home },
]

export const statusOrderIndex = (status) => STATUSES.indexOf(status)