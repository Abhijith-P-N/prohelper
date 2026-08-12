import { useState } from 'react'
import { FolderGit2, Users, Bell, Sparkles, RotateCcw, Info, Shield } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { SectionHeader } from '../components/ui/Card'
import { Card } from '../components/ui/Card'
import { supabaseEnabled } from '../lib/supabase'

const TABS = [
  { id: 'project', label: 'Project', icon: FolderGit2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai', label: 'AI', icon: Sparkles },
]

export default function Settings() {
  const { db, updateSettings, reload } = useWorkspace()
  const { configured } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('project')
  const settings = db.settings
  const active = TABS.find((t) => t.id === tab)

  const patch = async (group, key, value) => {
    try {
      await updateSettings(group, { [key]: value })
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    }
  }

  const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-600">{hint}</p>}
    </div>
  )

  const Toggle = ({ on, onClick, label }) => (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/10'}`}
      aria-pressed={on}
      role="switch"
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      <span className="sr-only">{label}</span>
    </button>
  )

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Configure the project, team behaviour, notifications and the AI layer." />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="panel h-fit p-3">
          <nav className="space-y-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === t.id ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-[10px] text-slate-600">
            <p className="flex items-center gap-1.5"><Info size={11} /> Mode: <span className="font-semibold text-slate-400">{configured ? 'supabase live' : 'not configured'}</span></p>
            <p className="flex items-center gap-1.5"><Shield size={11} /> DB: <span className="font-semibold text-slate-400">{supabaseEnabled ? 'Supabase Postgres' : 'no keys set — add client/.env'}</span></p>
          </div>
        </aside>

        <div className="space-y-4">
          <Card>
            <Card.Header icon={active?.icon} title={active?.label} subtitle={`Settings for ${active?.label.toLowerCase()} scope`} />
            <Card.Body className="space-y-5">
              {tab === 'project' && (
                <>
                  <Field label="Project name">
                    <input className="input" value={settings.project.name} onChange={(e) => patch('project', 'name', e.target.value)} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Subscription tier">
                      <select className="input" value={settings.project.subscription} onChange={(e) => patch('project', 'subscription', e.target.value)}>
                        {['Free', 'Pro', 'Team', 'Enterprise'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select className="input" value={settings.project.timezone} onChange={(e) => patch('project', 'timezone', e.target.value)}>
                        {['Asia/Calcutta', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai'].map((z) => <option key={z}>{z}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Default AI tool">
                    <select className="input" value={settings.project.defaultAITool} onChange={(e) => patch('project', 'defaultAITool', e.target.value)}>
                      {['Claude (Copilot)', 'GitHub Copilot', 'OpenAI', 'Gemini', 'Cursor'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {tab === 'team' && (
                <>
                  <Field label="Sprint length (days)" hint="Overrides the seeded 21-day sprint window.">
                    <input className="input" type="number" value={settings.team.sprintLengthDays} onChange={(e) => patch('team', 'sprintLengthDays', Number(e.target.value))} />
                  </Field>
                  <SettingRow label="Freeze week deliverables during review" hint="Stops status edits on shipped week tasks during review window.">
                    <Toggle on={settings.team.weekFreeze} onClick={() => patch('team', 'weekFreeze', !settings.team.weekFreeze)} label="Week freeze" />
                  </SettingRow>
                  <SettingRow label="Auto-block tasks on dependency" hint="Any task whose dependency is not done is flagged blocked automatically.">
                    <Toggle on={settings.team.autoBlockOnDependency} onClick={() => patch('team', 'autoBlockOnDependency', !settings.team.autoBlockOnDependency)} label="Auto block" />
                  </SettingRow>
                </>
              )}

              {tab === 'notifications' && (
                <>
                  <SettingRow label="Email notifications" hint="All task, review and security alerts to your inbox.">
                    <Toggle on={settings.notifications.email} onClick={() => patch('notifications', 'email', !settings.notifications.email)} label="Email" />
                  </SettingRow>
                  <SettingRow label="Task assignments" hint="Immediate alert when a task is assigned or reassigned to you.">
                    <Toggle on={settings.notifications.taskAssignments} onClick={() => patch('notifications', 'taskAssignments', !settings.notifications.taskAssignments)} label="Assignments" />
                  </SettingRow>
                  <SettingRow label="Blocked-task alerts" hint="Push a warning when any of your tasks becomes blocked.">
                    <Toggle on={settings.notifications.blockedAlerts} onClick={() => patch('notifications', 'blockedAlerts', !settings.notifications.blockedAlerts)} label="Blocked alerts" />
                  </SettingRow>
                  <SettingRow label="Daily digest" hint="One email per day with the sprint summary.">
                    <Toggle on={settings.notifications.digestDaily} onClick={() => patch('notifications', 'digestDaily', !settings.notifications.digestDaily)} label="Digest" />
                  </SettingRow>
                </>
              )}

              {tab === 'ai' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Default model">
                      <select className="input" value={settings.ai.defaultModel} onChange={(e) => patch('ai', 'defaultModel', e.target.value)}>
                        {['claude-3.7-sonnet', 'claude-3.5-sonnet', 'gpt-4o', 'gemini-2.0-flash'].map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Temperature" hint={`Creativity vs determinism. Low = spec-faithful.`}>
                      <input className="input" type="number" step="0.1" min="0" max="1" value={settings.ai.temperature} onChange={(e) => patch('ai', 'temperature', Number(e.target.value))} />
                    </Field>
                  </div>
                  {[
                    { label: 'Always include PROJECT_SPEC.md', key: 'includeSpec' },
                    { label: 'Always include team architecture', key: 'includeArchitecture' },
                    { label: 'Always include API contract', key: 'includeApiContract' },
                    { label: 'Always include relevant dependencies', key: 'includeDependencies' },
                  ].map((row) => (
                    <SettingRow key={row.key} label={row.label} hint="Baked into every generated prompt's context block.">
                      <Toggle on={settings.ai[row.key]} onClick={() => patch('ai', row.key, !settings.ai[row.key])} label={row.label} />
                    </SettingRow>
                  ))}
                </>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="flex flex-wrap items-center gap-3">
              <button className="btn-ghost" onClick={() => reload().then(() => toast.success('Workspace synced from Supabase'))}>
                <RotateCcw size={14} /> Re-sync workspace data
              </button>
              <p className="text-[11px] text-slate-600">
                Pulls the latest tasks, members, prompts, security tests and chat straight from
                Supabase. Nothing destructive — your rows stay in Postgres.
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-base-900/40 px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-600">{hint}</p>}
      </div>
      {children}
    </div>
  )
}