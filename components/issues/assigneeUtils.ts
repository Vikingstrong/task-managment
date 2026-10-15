import type { Issue, ProjectMember, User, WorkspaceMember } from "@/types/api"

export interface ResolvedMember {
  user_id: string
  display_name: string
  email: string
  avatar_url: string | null
  role?: string
}

/**
 * Robustly extract the primary assignee ID from an issue across different backend formats
 */
export function extractAssigneeId(issue: Issue | null): string {
  if (!issue) return ""
  const anyIssue = issue as any
  if (anyIssue.assignee_id) return String(anyIssue.assignee_id)
  if (Array.isArray(anyIssue.assignee_ids) && anyIssue.assignee_ids.length > 0) {
    return String(anyIssue.assignee_ids[0])
  }
  if (Array.isArray(issue.assignees) && issue.assignees.length > 0) {
    const a = issue.assignees[0] as any
    return String(a.user_id || a.user?.id || a.id || "")
  }
  return ""
}

/**
 * Resolve display name, initial, and avatar for an assignee
 */
export function resolveAssigneeDisplay(
  issue: Issue,
  availableMembers: ResolvedMember[] = []
): { name: string; initial: string; avatarUrl: string | null } | null {
  const firstAssignee = issue.assignees?.[0] as any
  const assigneeId = extractAssigneeId(issue)

  // 1. Try to read directly from issue.assignees[0]
  if (firstAssignee) {
    const user = firstAssignee.user || firstAssignee
    const name = user.display_name || user.email || user.name
    if (name) {
      return {
        name,
        initial: (name || "U").charAt(0).toUpperCase(),
        avatarUrl: user.avatar_url || null,
      }
    }
  }

  // 2. Fallback to searching availableMembers by ID
  if (assigneeId && availableMembers.length > 0) {
    const found = availableMembers.find(
      (m) => m.user_id === assigneeId || (m as any).id === assigneeId
    )
    if (found) {
      const name = found.display_name || found.email
      return {
        name,
        initial: (name || "U").charAt(0).toUpperCase(),
        avatarUrl: found.avatar_url,
      }
    }
  }

  return null
}

/**
 * Merge workspace members and project members into a single unified list
 */
export function mergeAvailableMembers(
  workspaceMembers: WorkspaceMember[] = [],
  projectMembers: ProjectMember[] = []
): ResolvedMember[] {
  const map = new Map<string, ResolvedMember>()

  for (const wm of workspaceMembers) {
    if (wm.user_id) {
      map.set(wm.user_id, {
        user_id: wm.user_id,
        display_name: wm.user?.display_name || wm.user?.email || "Участник",
        email: wm.user?.email || "",
        avatar_url: wm.user?.avatar_url || null,
        role: wm.role,
      })
    }
  }

  for (const pm of projectMembers) {
    if (pm.user_id) {
      map.set(pm.user_id, {
        user_id: pm.user_id,
        display_name: pm.user?.display_name || pm.user?.email || "Участник",
        email: pm.user?.email || "",
        avatar_url: pm.user?.avatar_url || null,
        role: pm.role,
      })
    }
  }

  return Array.from(map.values())
}
