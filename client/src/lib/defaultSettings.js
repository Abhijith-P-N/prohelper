// Defaults used until the user has a saved settings row in Supabase.

export const DEFAULT_SETTINGS = {
  project: {
    name: 'Secure File Sharing Platform',
    subscription: 'Free',
    timezone: 'UTC',
    defaultAITool: 'Claude (Copilot)',
  },
  team: {
    sprintLengthDays: 21,
    weekFreeze: false,
    autoBlockOnDependency: true,
  },
  notifications: {
    email: true,
    taskAssignments: true,
    blockedAlerts: true,
    digestDaily: false,
  },
  ai: {
    defaultModel: 'claude-3.7-sonnet',
    temperature: 0.2,
    includeSpec: true,
    includeArchitecture: true,
    includeApiContract: true,
    includeDependencies: true,
  },
}

export const deepMerge = (base, overrides) => {
  if (!overrides) return structuredClone(base)
  const out = structuredClone(base)
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v)
    } else if (v !== null && v !== undefined) {
      out[k] = v
    }
  }
  return out
}