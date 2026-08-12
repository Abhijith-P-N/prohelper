import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { PROJECT } from '../lib/projectConfig.js'
import { DEFAULT_SETTINGS, deepMerge } from '../lib/defaultSettings.js'
import { supabaseEnabled, requireSupabase } from '../lib/supabase.js'

const WorkspaceContext = createContext(null)

// ── table → app shape ───────────────────────────────────────────────────────
const COLLECTIONS = [
  { table: 'team_members', key: 'teamMembers', map: (r) => ({ id: r.id, userId: r.user_id, name: r.name, role: r.role, branch: r.branch, color: r.color, status: r.status, focus: r.focus }) },
  { table: 'tasks', key: 'tasks', map: (r) => ({ id: r.id, key: r.key, title: r.title, description: r.description, status: r.status, priority: r.priority, assigneeId: r.assignee_id, week: r.week, dueDate: r.due_date, tags: r.tags || [], createdAt: r.created_at }) },
  { table: 'task_dependencies', key: 'taskDependencies', map: (r) => ({ id: r.id, taskId: r.task_id, dependsOnId: r.depends_on_id }) },
  { table: 'prompts', key: 'prompts', map: (r) => ({ id: r.id, memberId: r.member_id, taskId: r.task_id, week: r.week, title: r.title, aiTool: r.ai_tool, prompt: r.prompt, saved: r.saved }) },
  { table: 'roadmap', key: 'roadmap', map: (r) => ({ id: r.id, week: r.week, theme: r.theme, goal: r.goal, status: r.status, milestones: r.milestones || [], planned: r.planned }) },
  { table: 'api_endpoints', key: 'apiEndpoints', map: (r) => ({ id: r.id, method: r.method, name: r.name, path: r.path, purpose: r.purpose, auth: r.auth, body: r.body || [], response: r.response, status: r.status }) },
  { table: 'security_tests', key: 'securityTests', map: (r) => ({ id: r.id, name: r.name, category: r.category, status: r.status, severity: r.severity, description: r.description, testedBy: r.tested_by, testedOn: r.tested_on }) },
  { table: 'documents', key: 'documents', map: (r) => ({ id: r.id, section: r.section, title: r.title, content: r.content || [] }) },
  { table: 'activity_logs', key: 'activityLogs', map: (r) => ({ id: r.id, actorId: r.actor_id, action: r.action, target: r.target, type: r.type, at: r.created_at }) },
  { table: 'chat_messages', key: 'chatMessages', map: (r) => ({ id: r.id, authorId: r.author_id, text: r.text, kind: r.kind, at: r.created_at }) },
]

const emptyDb = () => ({
  project: PROJECT,
  teamMembers: [],
  tasks: [],
  taskDependencies: [],
  prompts: [],
  roadmap: [],
  apiEndpoints: [],
  securityTests: [],
  documents: [],
  activityLogs: [],
  chatMessages: [],
  settings: DEFAULT_SETTINGS,
  currentMember: null,
})

const hashColor = (name = 'm') => {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${h % 360} 70% 55%)`
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [db, setDb] = useState(emptyDb)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const dbRef = useRef(db)

  useEffect(() => { dbRef.current = db }, [db])

  const client = () => requireSupabase()

  const loadCollections = async (userId) => {
    const supabase = client()
    const results = await Promise.all(
      COLLECTIONS.map(async ({ table, key, map }) => {
        const { data, error } = await supabase.from(table).select('*')
        if (error) return { key, rows: null, error }
        let rows = (data || []).map(map)
        if (key === 'activityLogs') rows = rows.sort((a, b) => new Date(b.at) - new Date(a.at))
        if (key === 'chatMessages') rows = rows.sort((a, b) => new Date(a.at) - new Date(b.at))
        return { key, rows, error: null }
      })
    )

    const failed = results.find((r) => r.error)
    if (failed) return { ok: false, message: failed.error.message, data: {} }

    const patch = Object.fromEntries(results.map((r) => [r.key, r.rows]))

    let settings = DEFAULT_SETTINGS
    if (userId) {
      const { data: row, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
      if (!error && row) settings = deepMerge(DEFAULT_SETTINGS, row)
    }

    const currentMember = (patch.teamMembers || []).find((m) => m.userId === userId) || null
    return { ok: true, message: '', data: { ...patch, settings, currentMember } }
  }

  const refresh = async (keys = COLLECTIONS.map((c) => c.key)) => {
    const supabase = client()
    const entries = await Promise.all(
      keys.map(async (key) => {
        const conf = COLLECTIONS.find((c) => c.key === key)
        if (!conf) return [key, dbRef.current[key]]
        const { data, error } = await supabase.from(conf.table).select('*')
        if (error) throw new Error(error.message)
        let rows = (data || []).map(conf.map)
        if (key === 'activityLogs') rows = rows.sort((a, b) => new Date(b.at) - new Date(a.at))
        if (key === 'chatMessages') rows = rows.sort((a, b) => new Date(a.at) - new Date(b.at))
        return [key, rows]
      })
    )
    setDb((prev) => {
      const next = { ...prev }
      for (const [k, v] of entries) next[k] = v
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!supabaseEnabled) {
        setDb(emptyDb())
        setLoading(false)
        setReady(true)
        return
      }
      if (!user) {
        setDb(emptyDb())
        setLoading(false)
        setReady(true)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await loadCollections(user.id)
        if (cancelled) return
        if (res.ok) setDb((prev) => ({ ...prev, ...res.data }))
        else setError(res.message || 'Failed to load workspace')
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load workspace')
      } finally {
        if (!cancelled) { setLoading(false); setReady(true) }
      }
    }
    run()
    return () => { cancelled = true }
  }, [user?.id])

  const recordActivity = async (actorId, action, target, type = 'task') => {
    await client().from('activity_logs').insert({ actor_id: actorId || null, action, target: target || '', type })
    await refresh(['activityLogs'])
  }

  // ── task key generator (T01, T02 …) ──────────────────────────────────────
  const nextTaskKey = () => {
    const nums = dbRef.current.tasks
      .map((t) => parseInt(String(t.key || '').replace(/\D/g, ''), 10))
      .filter((n) => Number.isFinite(n))
    let n = (nums.length ? Math.max(...nums) : 0) + 1
    while (dbRef.current.tasks.some((t) => t.key === `T${String(n).padStart(2, '0')}`)) n += 1
    return `T${String(n).padStart(2, '0')}`
  }

  const ensureCurrentMemberInternal = async () => {
    if (!user) return null
    if (dbRef.current.currentMember) return dbRef.current.currentMember
    const supabase = client()
    let { data, error } = await supabase.from('team_members').select('*').eq('user_id', user.id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member'
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member'
      const ins = await supabase.from('team_members').insert({
        user_id: user.id, name, role: 'Member', branch: `feature/${slug}`, color: hashColor(name), status: 'online', focus: '',
      }).select().single()
      if (ins.error) throw new Error(ins.error.message)
      data = ins.data
    }
    const member = COLLECTIONS[0].map(data)
    setDb((prev) => ({ ...prev, currentMember: member }))
    return member
  }

  const api = useMemo(() => ({
    db,
    loading,
    ready,
    error,
    reload: async () => {
      setLoading(true)
      setError('')
      try {
        const res = await loadCollections(user?.id)
        if (res.ok) setDb((prev) => ({ ...prev, ...res.data }))
        else setError(res.message)
      } catch (e) {
        setError(e.message || 'Failed to reload')
      } finally {
        setLoading(false)
      }
    },

    // ── team members ───────────────────────────────────────────────────────
    ensureCurrentMember: ensureCurrentMemberInternal,

    addMember: async ({ name, role, branch, color }) => {
      const supabase = client()
      const { data, error } = await supabase.from('team_members').insert({
        user_id: user?.id || null, name, role: role || 'Member', branch: branch || `feature/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, color: color || hashColor(name), status: 'online', focus: '',
      }).select().single()
      if (error) throw new Error(error.message)
      await refresh(['teamMembers'])
      return data.id
    },

    updateMember: async (id, patch) => {
      const { error } = await client().from('team_members').update(patch).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['teamMembers'])
      if (dbRef.current.currentMember?.id === id) await refresh(['teamMembers'])
    },

    deleteMember: async (id) => {
      const { error } = await client().from('team_members').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['teamMembers'])
    },

    // ── tasks ──────────────────────────────────────────────────────────────
    addTask: async (input) => {
      const { data, error } = await client().from('tasks').insert({
        key: nextTaskKey(),
        title: input.title,
        description: input.description || '',
        status: input.status || 'todo',
        priority: input.priority || 'medium',
        week: Number(input.week) || 1,
        due_date: input.dueDate || null,
        assignee_id: input.assigneeId || null,
        tags: input.tags || [],
      }).select().single()
      if (error) throw new Error(error.message)
      await refresh(['tasks'])
      return data.id
    },

    updateTask: async (id, patch) => {
      const withResource = { ...patch }
      delete withResource.id
      const args = {
        title: withResource.title, description: withResource.description, status: withResource.status,
        priority: withResource.priority, week: withResource.week, due_date: withResource.dueDate, assignee_id: withResource.assigneeId, tags: withResource.tags,
      }
      const { error } = await client().from('tasks').update(args).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['tasks'])
    },

    deleteTask: async (id) => {
      const { error } = await client().from('tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['tasks', 'taskDependencies'])
    },

    setTaskStatus: async (id, status, actorId) => {
      const { error } = await client().from('tasks').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)
      await Promise.all([refresh(['tasks']), recordActivity(actorId, `moved task to ${status}`, id)])
    },

    addDependency: async (taskId, dependsOnId) => {
      const exists = dbRef.current.taskDependencies.some((d) => d.taskId === taskId && d.dependsOnId === dependsOnId)
      if (exists) return
      const { error } = await client().from('task_dependencies').insert({ task_id: taskId, depends_on_id: dependsOnId })
      if (error) throw new Error(error.message)
      await refresh(['taskDependencies'])
    },

    removeDependency: async (id) => {
      const { error } = await client().from('task_dependencies').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['taskDependencies'])
    },

    // ── prompts ────────────────────────────────────────────────────────────
    savePrompt: async (prompt) => {
      const supabase = client()
      const payload = {
        member_id: prompt.memberId || null,
        task_id: prompt.taskId || null,
        week: prompt.week || null,
        title: prompt.title,
        ai_tool: prompt.aiTool || 'Claude (Copilot)',
        prompt: prompt.prompt,
        saved: 'saved' in prompt ? prompt.saved : true,
      }
      if (prompt.id) {
        const { error } = await supabase.from('prompts').update(payload).eq('id', prompt.id)
        if (error) throw new Error(error.message)
        await refresh(['prompts'])
        return prompt.id
      }
      const { data, error } = await supabase.from('prompts').insert(payload).select().single()
      if (error) throw new Error(error.message)
      await refresh(['prompts'])
      return data.id
    },

    deletePrompt: async (id) => {
      const { error } = await client().from('prompts').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['prompts'])
    },

    togglePromptSaved: async (id) => {
      const prompt = dbRef.current.prompts.find((p) => p.id === id)
      if (!prompt) return
      const { error } = await client().from('prompts').update({ saved: !prompt.saved }).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['prompts'])
    },

    // ── chat ───────────────────────────────────────────────────────────────
    addChatMessage: async (authorId, text) => {
      const supabase = client()
      if (!authorId) {
        const member = await ensureCurrentMemberInternal()
        if (!member) throw new Error('Sign in before sending messages')
        authorId = member.id
      }
      const insert = { text, kind: 'message' }
      if (authorId) insert.author_id = authorId
      const { error } = await supabase.from('chat_messages').insert(insert)
      if (error) throw new Error(error.message)
      await refresh(['chatMessages'])
    },

    // ── security tests / roadmap / docs-style tables ───────────────────────
    updateSecurityTest: async (id, patch) => {
      const { error } = await client().from('security_tests').update(patch).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['securityTests'])
    },

    updateRoadmap: async (id, patch) => {
      const { error } = await client().from('roadmap').update(patch).eq('id', id)
      if (error) throw new Error(error.message)
      await refresh(['roadmap'])
    },

    updateSettings: async (group, patch) => {
      const supabase = client()
      const row = dbRef.current.settings
      const next = deepMerge(row, { [group]: patch })
      // persist full settings object; project/team/notifications/ai are jsonb columns
      const rowData = {
        project: next.project,
        team: next.team,
        notifications: next.notifications,
        ai: next.ai,
      }
      const existing = await supabase.from('settings').select('id').eq('user_id', user?.id).maybeSingle()
      if (existing.data) {
        const { error } = await supabase.from('settings').update(rowData).eq('id', existing.data.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('settings').insert({ user_id: user?.id, ...rowData })
        if (error) throw new Error(error.message)
      }
      setDb((prev) => ({ ...prev, settings: next }))
    },

    recordActivity,
    refresh,
  }), [db, loading, ready, error, user?.id])

  return <WorkspaceContext.Provider value={api}>{children}</WorkspaceContext.Provider>
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}