import type { EmailPreferences, Json } from '@/types/database.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeEmailPreferences(
  preferences: EmailPreferences | Json | null | undefined
): EmailPreferences {
  if (!isRecord(preferences)) {
    return {}
  }

  const record = preferences as Record<string, unknown>

  return {
    newPosts: typeof record.newPosts === 'boolean' ? record.newPosts : undefined,
    weekly: typeof record.weekly === 'boolean' ? record.weekly : undefined,
    monthly: typeof record.monthly === 'boolean' ? record.monthly : undefined,
  }
}
