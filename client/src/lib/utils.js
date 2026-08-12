import { PROJECT_START } from './projectConfig.js'

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const daysIntoProject = (date = new Date()) =>
  Math.max(0, Math.floor((date.getTime() - new Date(PROJECT_START).getTime()) / 86400000))

export const currentWeek = (date = new Date()) => Math.min(3, Math.floor(daysIntoProject(date) / 7) + 1)

export const currentDay = (date = new Date()) => Math.min(21, daysIntoProject(date) + 1)

export const totalProjectDays = 21

export const progressPercent = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100))

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const timeAgo = (iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export const isOverdue = (iso) => new Date(iso).getTime() < Date.now()

export const memberById = (members, id) => members.find((m) => m.id === id)

export const taskById = (tasks, id) => tasks.find((t) => t.id === id)

export function blockedTaskIds(tasks, deps) {
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]))
  const incomplete = new Set(tasks.filter((t) => t.status !== 'done').map((t) => t.id))
  const blocked = new Map()
  for (const d of deps) {
    const originTask = byId[d.taskId]
    if (!originTask || originTask.status === 'done') continue
    if (incomplete.has(d.dependsOnId)) {
      const entry = blocked.get(d.taskId) || []
      const dep = byId[d.dependsOnId]
      if (dep) entry.push(dep)
      blocked.set(d.taskId, entry)
    }
  }
  return blocked
}

export function taskBlockedStatus(tasks, deps, taskId) {
  return blockedTaskIds(tasks, deps).get(taskId) || null
}

export const dependencyChainFor = (tasks, deps, taskId) => {
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]))
  const seen = new Set()
  const chain = []
  const walk = (id) => {
    if (seen.has(id)) return
    seen.add(id)
    for (const d of deps) {
      if (d.taskId === id) walk(d.dependsOnId)
    }
    const t = byId[id]
    if (t && id !== taskId) chain.push(t)
  }
  walk(taskId)
  return chain
}

export const memberStats = (db) => {
  const stats = {}
  for (const member of db.teamMembers) {
    const mine = db.tasks.filter((t) => t.assigneeId === member.id)
    const done = mine.filter((t) => t.status === 'done').length
    stats[member.id] = {
      total: mine.length,
      done,
      inProgress: mine.filter((t) => t.status === 'in-progress').length,
      review: mine.filter((t) => t.status === 'review').length,
      todo: mine.filter((t) => t.status === 'todo').length,
      progress: progressPercent(done, mine.length),
      current: taskById(db.tasks, member.currentTaskId) || null,
    }
  }
  return stats
}

export function cl(text) {
  const h = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return `hsl(${h % 360} 70% 55%)`
}