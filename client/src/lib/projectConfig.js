// Product config — the real, configurable constants for the Secure File Sharing Platform build.
// These are NOT dummy data; they define the sprint window and phase naming.

export const PROJECT_START = '2026-08-13'

export const PROJECT = {
  id: 'p-secure-share',
  name: 'Secure File Sharing Platform',
  codename: 'SecureSync',
  goal: 'Privacy-first file sharing with encryption-at-rest, password protection, expiration and download limits.',
  status: 'active',
  startDate: PROJECT_START,
  durationWeeks: 3,
}

export const WEEK_LABELS = ['Week 1 · Prototype', 'Week 2 · Security', 'Week 3 · Finalization']
export const WEEK_THEMES = ['Prototype', 'Security', 'Finalization']