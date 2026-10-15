export type User = {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  user: User
}

export type ChangePasswordRequest = {
  current_password: string
  new_password: string
}

export type WorkspaceRole = "owner" | "admin" | "member" | "guest"

export type Workspace = {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export type WorkspaceMember = {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
  updated_at: string
  user: User
}

export type WorkspaceInvite = {
  id: string
  workspace_id: string
  invited_by_id: string
  email: string
  role: WorkspaceRole
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  workspace?: {
    id: string
    name: string
    slug: string
  }
  invited_by?: {
    id: string
    display_name: string
    email: string
  }
}

export type ProjectRole = "admin" | "member" | "viewer"

export type Project = {
  id: string
  workspace_id: string
  name: string
  identifier: string
  description: string | null
  lead_id: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type ProjectMember = {
  project_id: string
  user_id: string
  role: ProjectRole
  created_at: string
  user: User
}

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled"

export type ProjectState = {
  id: string
  project_id: string
  name: string
  color: string
  group: StateGroup
  order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export type ProjectLabel = {
  id: string
  workspace_id: string
  project_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export type IssuePriority = "none" | "low" | "medium" | "high" | "urgent"

export type Issue = {
  id: string
  workspace_id: string
  project_id: string
  sequence_id: number
  title: string
  description: string | null
  state_id: string
  priority: IssuePriority
  parent_id: string | null
  estimate_points: number | null
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  created_by_id: string
  sort_order: number
  created_at: string
  updated_at: string
  assignees?: Array<IssueAssignee | User>
  labels?: ProjectLabel[]
}

export type IssueAssignee = {
  issue_id?: string
  user_id: string
  created_at?: string
  user?: User
}

export type IssuesListResponse = {
  data: Issue[]
  next_cursor: string | null
  group_by?: "state" | "priority" | "assignee"
  groups?: Array<{
    key: string | null
    issues: Issue[]
  }>
}

export type IssueComment = {
  id: string
  issue_id: string
  author_id: string
  body: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  author: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export type RelationType = "blocks" | "blocked_by" | "relates_to" | "duplicates"

export type IssueRelation = {
  id: string
  issue_id: string
  related_issue_id: string
  relation_type: RelationType
  created_at: string
  related_issue: {
    id: string
    sequence_id: number
    title: string
    priority: IssuePriority
    state_id: string
    project_id: string
  }
}

export type IssueRelationsResponse = {
  blocks: IssueRelation[]
  blocked_by: IssueRelation[]
  relates_to: IssueRelation[]
  duplicates: IssueRelation[]
}

export type CycleStatus = "upcoming" | "active" | "completed"

export type ProgressBreakdown = {
  total: number
  backlog: number
  unstarted: number
  started: number
  completed: number
  cancelled: number
  completion_percentage: number
}

export type Cycle = {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: CycleStatus
  created_at: string
  updated_at: string
  progress?: ProgressBreakdown
}

export type ModuleStatus = "backlog" | "in_progress" | "paused" | "completed" | "cancelled"

export type Module = {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  status: ModuleStatus
  lead_id: string | null
  start_date: string | null
  target_date: string | null
  created_at: string
  updated_at: string
  progress?: ProgressBreakdown
}

export type IssueAttachment = {
  id: string
  workspace_id: string
  issue_id: string
  uploaded_by_id: string
  file_name: string
  file_size: number
  mime_type: string
  storage_key: string
  created_at: string
  download_url: string
  uploaded_by: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export type AttachmentUploadResponse = {
  attachment: IssueAttachment
  upload: {
    url: string
    method: string
    headers: Record<string, string>
    expires_in: number
  }
}

export type NotificationType = "issue_assigned" | "comment_added" | "mentioned"

export type Notification = {
  id: string
  workspace_id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  issue_id: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  actor: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export type NotificationsResponse = {
  data: Notification[]
  unread_count: number
  next_cursor: string | null
}

export type ActivityItem = {
  id: string
  workspace_id: string
  issue_id: string | null
  actor_id: string
  action: string
  field: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  actor: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export type ActivityResponse = {
  data: ActivityItem[]
  next_cursor: string | null
}