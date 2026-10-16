/**
 * Utilities for local invite storage and cross-account UX simulation in dev/learning environments.
 */

export interface SentInviteRecord {
  id: string
  email: string
  role: string
  token: string
  workspaceSlug: string
  createdAt: string
  expiresAt?: string
}

export interface PendingInviteRecord {
  token: string
  email: string
  workspaceSlug: string
  workspaceName: string
  role: string
  createdAt: string
  expiresAt?: string
}

const LOCAL_PENDING_KEY = "local_pending_invites"
const INVITES_UPDATED_EVENT = "local-invites-updated"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function notifyLocalInvitesChanged(): void {
  if (isBrowser()) {
    window.dispatchEvent(new Event(INVITES_UPDATED_EVENT))
  }
}

export function subscribeToLocalInvites(callback: () => void): () => void {
  if (!isBrowser()) return () => {}
  window.addEventListener(INVITES_UPDATED_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(INVITES_UPDATED_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

// 1. Sent Invites per workspace
export function getSentInvites(workspaceSlug: string): SentInviteRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(`sent_invites_${workspaceSlug}`)
    if (!raw) return []
    return JSON.parse(raw) as SentInviteRecord[]
  } catch {
    return []
  }
}

export function saveSentInvite(workspaceSlug: string, record: SentInviteRecord): void {
  if (!isBrowser()) return
  try {
    const list = getSentInvites(workspaceSlug)
    // Avoid duplicate tokens
    const filtered = list.filter((item) => item.token !== record.token)
    filtered.unshift(record)
    localStorage.setItem(`sent_invites_${workspaceSlug}`, JSON.stringify(filtered))
    notifyLocalInvitesChanged()
  } catch {
    // Ignore storage quota
  }
}

export function removeSentInvite(workspaceSlug: string, token: string): void {
  if (!isBrowser()) return
  try {
    const list = getSentInvites(workspaceSlug)
    const filtered = list.filter((item) => item.token !== token)
    localStorage.setItem(`sent_invites_${workspaceSlug}`, JSON.stringify(filtered))
    notifyLocalInvitesChanged()
  } catch {
    // Ignore
  }
}

// 2. Global Pending Invites
export function getLocalPendingInvites(): PendingInviteRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(LOCAL_PENDING_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PendingInviteRecord[]
  } catch {
    return []
  }
}

export function addLocalPendingInvite(record: PendingInviteRecord): void {
  if (!isBrowser()) return
  try {
    const list = getLocalPendingInvites()
    const filtered = list.filter((item) => item.token !== record.token)
    filtered.unshift(record)
    localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(filtered))
    notifyLocalInvitesChanged()
  } catch {
    // Ignore
  }
}

export function removeLocalPendingInvite(token: string): void {
  if (!isBrowser()) return
  try {
    const list = getLocalPendingInvites()
    const filtered = list.filter((item) => item.token !== token)
    localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(filtered))
    notifyLocalInvitesChanged()
  } catch {
    // Ignore
  }
}

export function getPendingInvitesForEmail(email?: string | null): PendingInviteRecord[] {
  if (!email || !isBrowser()) return []
  const cleanEmail = email.trim().toLowerCase()
  const all = getLocalPendingInvites()
  return all.filter((inv) => inv.email.trim().toLowerCase() === cleanEmail)
}

/**
 * Extracts invite token if user passes a full URL (e.g. http://localhost:3000/invites/TOKEN)
 * or trims raw token string.
 */
export function extractInviteToken(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  // If full or relative URL
  const match = trimmed.match(/\/invites\/([a-zA-Z0-9_-]+)/)
  if (match && match[1]) {
    return match[1]
  }

  // If contains query ?invite_token=
  const tokenParamMatch = trimmed.match(/[?&]invite_token=([a-zA-Z0-9_-]+)/)
  if (tokenParamMatch && tokenParamMatch[1]) {
    return tokenParamMatch[1]
  }

  return trimmed
}
