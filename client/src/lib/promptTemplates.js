import { WEEK_LABELS } from './projectConfig.js'

function resolveMember(data, memberId, overrides = {}) {
  const found = data?.teamMembers?.find((m) => m.id === memberId)
  if (found) {
    return { id: found.id, name: found.name, role: found.role, branch: found.branch, color: found.color }
  }
  const role = overrides.role || 'Developer'
  const slug = (overrides.name || role).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member'
  return {
    id: memberId || null,
    name: overrides.name || role,
    role,
    branch: overrides.branch || `feature/${slug}`,
    color: '#00d4a8',
  }
}

function sectionLines(data, task, member) {
  const deps = (data?.taskDependencies || [])
    .filter((d) => task && d.taskId === task.id)
    .map((d) => {
      const dep = (data?.tasks || []).find((t) => t.id === d.dependsOnId)
      return dep ? `task ${dep.key} (${dep.title})` : null
    })
    .filter(Boolean)

  const api = (data?.apiEndpoints || [])
    .slice(0, 6)
    .map((e) => `  - ${e.method} ${e.path} — ${e.purpose}`)
    .join('\n')

  return {
    spec:
      'Read PROJECT_SPEC.md at the repository root first. You MUST follow section 2 (non-negotiable requirements), section 6 (Core dependencies) and section 7 (Security & encryption architecture) exactly.',
    architecture: [
      `Team architecture (from PROJECT_SPEC section 4). This work is owned on branch ${member.branch}:`,
      `- ${member.name} (${member.role}) → this stream.`,
      '  Frontend & UI/UX → client UI · Backend & API → REST layer',
      '  Security & Encryption → crypto, tokens, integrity · Database/Storage/DevOps → Postgres, blobs, deploys',
      'Follow existing, idiomatic patterns in the codebase. Do not invent a different dependency graph.',
    ].join('\n'),
    api:
      'API contract (PROJECT_SPEC section 5; full list on the API Contract page). Consume/produce exactly these shapes:\n' +
      api +
      '\nErrors must be `{ error: { code, message } }` — never leak internals.',
    deps: [
      'Relevant dependencies (PROJECT_SPEC section 6):',
      '- Frontend: React 18, Vite 5, Tailwind 3, React Router 6, Framer Motion 11, lucide-react.',
      '- Backend: Node 20+, Express 4; crypto built-ins; jsonwebtoken, helmet, express-rate-limit.',
      deps.length
        ? `- Delivery depends on completed ${deps.join(', ')} — keep the interface compatible.`
        : '- No new package dependencies unless the task explicitly requires one.',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export function buildPrompt({ data, memberId, taskId, role, week, technology, aiTool, name, branch }) {
  const member = resolveMember(data, memberId, { role, name, branch })
  const weekLabel = week ? WEEK_LABELS[week - 1] : 'current sprint'
  const t = taskId ? (data?.tasks || []).find((x) => x.id === taskId) : null
  const ctx = sectionLines(data, t, member)

  return `You are implementing ${t ? `task ${t.key} — "${t.title}"` : 'the stated goal'} for the Secure File Sharing Platform on ${member.role} (${member.name}, branch ${member.branch}).

PHASE: ${weekLabel}. STACK: ${technology || 'the agreed stack'}. AI TOOL: ${aiTool || 'your default'}.

1. PROJECT_SPEC
${ctx.spec}

2. TEAM ARCHITECTURE
${ctx.architecture}

3. API CONTRACT
${ctx.api}

4. DEPENDENCIES
${ctx.deps}

TASK
${t?.description || 'Implement the goal described, following the architecture and contract above.'}
${t ? `Reference the task context: due ${t.dueDate || 'TBD'}, priority ${t.priority}.` : ''}

REQUIREMENTS
1. Follow the existing, idiomatic patterns in this codebase for the stack above.
2. Add loading, empty, error and success states for any UI work.
3. Never log secrets, keys, tokens or plaintext payloads.
4. Include tests with one happy path and one negative path.
5. Keep the change scoped to this task; call out anything that must wait on a blocked dependency.

Deliver the implementation with a short summary of what depends on it next.`
}

export function regenerate(target, base) {
  return buildPrompt({ ...base, ...target })
}