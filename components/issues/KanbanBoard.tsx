"use client"

import * as React from "react"
import { AlertCircle, Loader2, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  useGetStatesQuery,
  useCreateStateMutation,
} from "@/redux/api/stateApi"
import {
  useGetIssuesQuery,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useAddIssueAssigneeMutation,
  useRemoveIssueAssigneeMutation,
} from "@/redux/api/issueApi"
import { useGetProjectMembersQuery } from "@/redux/api/projectApi"
import { useGetWorkspaceMembersQuery } from "@/redux/api/workspaceApi"
import { useGetLabelsQuery } from "@/redux/api/labelApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { DEFAULT_WORKFLOW_STATES, getStateGroupIcon } from "./kanbanConstants"
import { KanbanCard } from "./KanbanCard"
import { TaskListRow } from "./TaskListRow"
import { CreateIssueModal } from "./CreateIssueModal"
import { IssueDetailModal } from "./IssueDetailModal"
import { DeleteIssueModal } from "./DeleteIssueModal"
import { WorkflowStatesModal } from "./WorkflowStatesModal"
import {
  KanbanFilterBar,
  type KanbanFiltersState,
  type GroupByOption,
} from "./KanbanFilterBar"
import { mergeAvailableMembers } from "./assigneeUtils"
import { cn } from "@/lib/utils"
import type { Issue, IssuePriority, ProjectState } from "@/types/api"

interface KanbanBoardProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  viewLayout?: "board" | "list"
}

interface KanbanColumnModel {
  id: string
  title: string
  color: string
  issues: Issue[]
  icon?: React.ReactNode
  avatarInitial?: string
  isDefault?: boolean
  defaultStateId?: string
  priority?: IssuePriority
  assigneeId?: string
}

export default function KanbanBoard({
  workspaceSlug,
  projectId,
  projectIdentifier,
  viewLayout = "board",
}: KanbanBoardProps) {
  const [createModalState, setCreateModalState] = React.useState<{
    isOpen: boolean
    initialStateId?: string
    initialPriority?: IssuePriority
    initialAssigneeId?: string
    instanceId: number
  }>({ isOpen: false, instanceId: 0 })

  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null)
  const [isInitializingStates, setIsInitializingStates] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"all" | "active">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [draggingIssueId, setDraggingIssueId] = React.useState<string | null>(null)
  const [activeDropColumnId, setActiveDropColumnId] = React.useState<string | null>(null)
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = React.useState(false)

  // Group By mode: "state" | "priority" | "assignee"
  const [groupBy, setGroupBy] = React.useState<GroupByOption>("state")

  // Multi-filters state
  const [filters, setFilters] = React.useState<KanbanFiltersState>({
    priorities: [],
    assigneeIds: [],
    labelIds: [],
    dateFilter: "all",
    subtaskFilter: "all",
  })

  // Delete Issue Modal state
  const [deleteModalState, setDeleteModalState] = React.useState<{
    isOpen: boolean
    issueId: string
    title: string
    sequenceId: number | string
  }>({
    isOpen: false,
    issueId: "",
    title: "",
    sequenceId: "",
  })
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleOpenCreateModal = (
    initialStateId?: string,
    initialPriority?: IssuePriority,
    initialAssigneeId?: string
  ) => {
    setCreateModalState((prev) => ({
      isOpen: true,
      initialStateId,
      initialPriority,
      initialAssigneeId,
      instanceId: prev.instanceId + 1,
    }))
  }

  // Fetch workflow states
  const {
    data: states = [],
    isLoading: isStatesLoading,
    isError: isStatesError,
  } = useGetStatesQuery({ workspaceSlug, projectId })

  // Fetch all issues
  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    isError: isIssuesError,
    refetch: refetchIssues,
  } = useGetIssuesQuery({
    workspaceSlug,
    projectId,
  })

  // Fetch project labels for multi-filtering
  const { data: projectLabels = [] } = useGetLabelsQuery({
    workspaceSlug,
    projectId,
  })

  // Project & workspace members for robust assignment
  const { data: projectMembers = [] } = useGetProjectMembersQuery({
    workspaceSlug,
    projectId,
  })
  const { data: workspaceMembers = [] } = useGetWorkspaceMembersQuery(workspaceSlug)

  const availableMembers = React.useMemo(() => {
    return mergeAvailableMembers(workspaceMembers, projectMembers)
  }, [workspaceMembers, projectMembers])

  const [createState] = useCreateStateMutation()
  const [updateIssue] = useUpdateIssueMutation()
  const [deleteIssue] = useDeleteIssueMutation()
  const [addIssueAssignee] = useAddIssueAssigneeMutation()
  const [removeIssueAssignee] = useRemoveIssueAssigneeMutation()

  // Auto-initialize standard lifecycle workflow states if project is brand new
  React.useEffect(() => {
    if (!isStatesLoading && !isStatesError && states.length === 0 && !isInitializingStates) {
      setIsInitializingStates(true)
      const initStates = async () => {
        try {
          for (const s of DEFAULT_WORKFLOW_STATES) {
            await createState({
              workspaceSlug,
              projectId,
              body: s,
            }).unwrap()
          }
        } catch (e) {
          console.error("Failed to initialize default states", e)
        } finally {
          setIsInitializingStates(false)
        }
      }
      initStates()
    }
  }, [isStatesLoading, isStatesError, states.length, isInitializingStates, createState, workspaceSlug, projectId])

  // Sort states by their defined sequence order
  const sortedStates = React.useMemo(() => {
    return [...states].sort((a, b) => a.order - b.order)
  }, [states])

  // Multi-filtering issues by tab, search, priorities, assignees, labels, dates, subtasks
  const filteredIssues = React.useMemo(() => {
    let list: Issue[] = [...issues]

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (issue: Issue) =>
          issue.title.toLowerCase().includes(q) ||
          `${projectIdentifier}-${issue.sequence_id}`.toLowerCase().includes(q) ||
          (issue.description && issue.description.toLowerCase().includes(q))
      )
    }

    // 2. Active View Mode (excludes completed/cancelled)
    if (viewMode === "active") {
      list = list.filter((issue: Issue) => {
        const state = states.find((s) => s.id === issue.state_id)
        return state?.group !== "completed" && state?.group !== "cancelled"
      })
    }

    // 3. Priorities Filter
    if (filters.priorities.length > 0) {
      list = list.filter((issue) => filters.priorities.includes(issue.priority))
    }

    // 4. Assignees Filter
    if (filters.assigneeIds.length > 0) {
      list = list.filter((issue) => {
        const assignedUserIds = (issue.assignees || []).map((a: any) =>
          String(a.user_id || a.user?.id || a.id || "")
        )
        const hasUnassigned = filters.assigneeIds.includes("unassigned")
        if (hasUnassigned && assignedUserIds.length === 0) return true
        return assignedUserIds.some((uid) => filters.assigneeIds.includes(uid))
      })
    }

    // 5. Labels Filter
    if (filters.labelIds.length > 0) {
      list = list.filter((issue) => {
        const issueLabelIds = (issue.labels || []).map((l: any) =>
          String(l.id || l.label_id || l.label?.id || "")
        )
        return issueLabelIds.some((lid) => filters.labelIds.includes(lid))
      })
    }

    // 6. Date Filter
    if (filters.dateFilter !== "all") {
      const now = new Date()
      list = list.filter((issue) => {
        if (!issue.due_date) return false
        const dueDate = new Date(issue.due_date)
        if (filters.dateFilter === "has_due") return true
        if (filters.dateFilter === "overdue") {
          const s = states.find((st) => st.id === issue.state_id)
          const isFinished = s?.group === "completed" || s?.group === "cancelled"
          return dueDate < now && !isFinished
        }
        if (filters.dateFilter === "this_week") {
          const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
          return diffDays >= -1 && diffDays <= 7
        }
        return true
      })
    }

    // 7. Subtasks Filter
    if (filters.subtaskFilter === "roots") {
      list = list.filter((i) => !i.parent_id)
    } else if (filters.subtaskFilter === "subtasks") {
      list = list.filter((i) => !!i.parent_id)
    }

    return list
  }, [
    issues,
    searchQuery,
    viewMode,
    states,
    projectIdentifier,
    filters,
  ])

  // Generate dynamic columns based on groupBy mode
  const columns: KanbanColumnModel[] = React.useMemo(() => {
    if (groupBy === "priority") {
      const priorities: { id: IssuePriority; title: string; color: string }[] = [
        { id: "urgent", title: "Срочный", color: "#ff5f56" },
        { id: "high", title: "Высокий", color: "#ff9500" },
        { id: "medium", title: "Средний", color: "#ffbd2e" },
        { id: "low", title: "Низкий", color: "#007aff" },
        { id: "none", title: "Без приоритета", color: "#8e8e93" },
      ]
      return priorities.map((p) => ({
        id: p.id,
        title: p.title,
        color: p.color,
        issues: filteredIssues.filter((i) => i.priority === p.id),
        priority: p.id,
        defaultStateId: sortedStates[0]?.id,
      }))
    }

    if (groupBy === "assignee") {
      const unassignedCol: KanbanColumnModel = {
        id: "unassigned",
        title: "Не назначен",
        color: "#8e8e93",
        issues: filteredIssues.filter(
          (i) => !i.assignees || i.assignees.length === 0
        ),
        assigneeId: "",
        defaultStateId: sortedStates[0]?.id,
      }

      const memberCols: KanbanColumnModel[] = availableMembers.map((m) => {
        const uid = m.user_id
        const name = m.display_name || m.email || "Участник"
        return {
          id: uid,
          title: name,
          color: "#007aff",
          avatarInitial: name.charAt(0).toUpperCase(),
          issues: filteredIssues.filter((i) =>
            (i.assignees || []).some(
              (a: any) => String(a.user_id || a.user?.id || a.id) === uid
            )
          ),
          assigneeId: uid,
          defaultStateId: sortedStates[0]?.id,
        }
      })

      return [unassignedCol, ...memberCols]
    }

    // Default: Group by workflow state
    return sortedStates.map((state) => ({
      id: state.id,
      title: state.name,
      color: state.color,
      issues: filteredIssues.filter((i: Issue) => i.state_id === state.id),
      icon: getStateGroupIcon(state.group),
      isDefault: state.is_default,
      defaultStateId: state.id,
    }))
  }, [groupBy, sortedStates, filteredIssues, availableMembers])

  // Move issue to a new workflow column
  const handleMoveIssueState = async (issueId: string, targetStateId: string) => {
    try {
      await updateIssue({
        workspaceSlug,
        projectId,
        issueId,
        body: { state_id: targetStateId },
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  // Move issue to a new priority column
  const handleMoveIssuePriority = async (issueId: string, targetPriority: IssuePriority) => {
    try {
      await updateIssue({
        workspaceSlug,
        projectId,
        issueId,
        body: { priority: targetPriority },
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  // Move issue to a new assignee column
  const handleMoveIssueAssignee = async (issueId: string, targetAssigneeId: string) => {
    const targetIssue = issues.find((i) => i.id === issueId)
    if (!targetIssue) return

    const currentAssigneeIds: string[] = []
    if (Array.isArray(targetIssue.assignees)) {
      for (const a of targetIssue.assignees as any[]) {
        const uid = a.user_id || a.user?.id || a.id
        if (uid) currentAssigneeIds.push(String(uid))
      }
    }

    try {
      // If unassigned, remove all current assignees
      if (!targetAssigneeId || targetAssigneeId === "unassigned") {
        for (const oldId of currentAssigneeIds) {
          try {
            await removeIssueAssignee({
              workspaceSlug,
              projectId,
              issueId,
              userId: oldId,
            }).unwrap()
          } catch {
            // Ignored
          }
        }
      } else {
        // Reassign to targetAssigneeId
        if (!currentAssigneeIds.includes(targetAssigneeId)) {
          for (const oldId of currentAssigneeIds) {
            try {
              await removeIssueAssignee({
                workspaceSlug,
                projectId,
                issueId,
                userId: oldId,
              }).unwrap()
            } catch {
              // Ignored
            }
          }
          await addIssueAssignee({
            workspaceSlug,
            projectId,
            issueId,
            userId: targetAssigneeId,
          }).unwrap()
        }
      }
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  // Unified drop handler supporting all 3 groupBy modes
  const handleColumnDrop = (issueId: string, targetColumn: KanbanColumnModel) => {
    if (groupBy === "priority") {
      handleMoveIssuePriority(issueId, targetColumn.id as IssuePriority)
    } else if (groupBy === "assignee") {
      handleMoveIssueAssignee(issueId, targetColumn.id)
    } else {
      handleMoveIssueState(issueId, targetColumn.id)
    }
  }

  // Quick update issue deadline
  const handleUpdateDueDate = async (issueId: string, dueDate: string | null) => {
    try {
      await updateIssue({
        workspaceSlug,
        projectId,
        issueId,
        body: {
          due_date: dueDate,
        },
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  // Request delete issue (opens MacModal)
  const handleRequestDelete = (issueId: string, title: string) => {
    const targetIssue = issues.find((i) => i.id === issueId)
    setDeleteModalState({
      isOpen: true,
      issueId,
      title,
      sequenceId: targetIssue ? targetIssue.sequence_id : "",
    })
  }

  // Confirm delete issue via API
  const handleConfirmDelete = async () => {
    if (!deleteModalState.issueId) return
    try {
      setIsDeleting(true)
      await deleteIssue({
        workspaceSlug,
        projectId,
        issueId: deleteModalState.issueId,
      }).unwrap()

      setDeleteModalState({
        isOpen: false,
        issueId: "",
        title: "",
        sequenceId: "",
      })

      if (selectedIssue?.id === deleteModalState.issueId) {
        setSelectedIssue(null)
      }
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading indicator
  if (isStatesLoading || isInitializingStates) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-foreground" />
        <p className="text-xs font-mono">Подготовка рабочего пространства задач...</p>
      </div>
    )
  }

  // Error state
  if (isStatesError || isIssuesError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-card p-8 text-center space-y-3">
        <AlertCircle className="size-6 text-destructive mx-auto" />
        <p className="text-sm text-destructive font-medium">
          Не удалось загрузить задачи проекта
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchIssues()}
          className="h-8 text-xs cursor-pointer"
        >
          Повторить попытку
        </Button>
      </div>
    )
  }

  const completedCount = issues.filter((i: Issue) => {
    const s = states.find((state) => state.id === i.state_id)
    return s?.group === "completed"
  }).length

  return (
    <div className="space-y-3">
      {/* Board Top Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs select-none">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented active filter */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "all"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Все задачи</span>
              <span className="rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted/60 text-muted-foreground">
                {issues.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "active"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>В работе</span>
              <span className="rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted/60 text-muted-foreground">
                {issues.length - completedCount}
              </span>
            </button>
          </div>

          {/* Quick Counter */}
          <div className="hidden md:flex items-center gap-2 border-l border-border pl-3 text-xs text-muted-foreground">
            <span>Выполнено:</span>
            <span className="font-mono font-medium text-emerald-500">
              {completedCount}/{issues.length}
            </span>
          </div>
        </div>

        {/* Search & Create Actions */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-3 text-xs outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="h-8 px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Создать задачу</span>
          </Button>
        </div>
      </div>

      {/* Multi-Filters & Group By Bar */}
      <KanbanFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        labels={projectLabels}
        members={availableMembers}
        onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
      />

      {/* Kanban Board or List View */}
      {viewLayout === "list" ? (
        <div className="space-y-4">
          {columns.map((col) => {
            return (
              <div
                key={col.id}
                className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-2xs"
              >
                {/* Column Group Header */}
                <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3.5 py-2.5 select-none">
                  <div className="flex items-center gap-2">
                    {col.avatarInitial ? (
                      <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                        {col.avatarInitial}
                      </div>
                    ) : (
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {col.title}
                    </span>
                    <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                      {col.issues.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenCreateModal(
                        col.defaultStateId || sortedStates[0]?.id,
                        col.priority,
                        col.assigneeId
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <Plus className="size-3.5" />
                    <span>Добавить задачу</span>
                  </button>
                </div>

                {/* Column Issues List */}
                <div className="p-2 space-y-1.5">
                  {col.issues.length === 0 ? (
                    <div className="px-4 py-3 text-center text-xs text-muted-foreground/60 select-none">
                      Нет задач в группе &laquo;{col.title}&raquo;
                    </div>
                  ) : (
                    col.issues.map((issue) => {
                      const curState =
                        states.find((s) => s.id === issue.state_id) || sortedStates[0]
                      return (
                        <TaskListRow
                          key={issue.id}
                          issue={issue}
                          projectIdentifier={projectIdentifier}
                          currentState={curState}
                          allStates={sortedStates}
                          availableMembers={availableMembers}
                          onSelect={(iss) => setSelectedIssue(iss)}
                          onMoveState={handleMoveIssueState}
                          onDelete={handleRequestDelete}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Kanban Columns with Drag & Drop */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {columns.map((col) => {
            const isOverThisColumn = activeDropColumnId === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (activeDropColumnId !== col.id) {
                    setActiveDropColumnId(col.id)
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    if (activeDropColumnId === col.id) {
                      setActiveDropColumnId(null)
                    }
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setActiveDropColumnId(null)
                  setDraggingIssueId(null)
                  try {
                    const dataStr = e.dataTransfer.getData("application/json")
                    if (dataStr) {
                      const { issueId } = JSON.parse(dataStr)
                      if (issueId) {
                        handleColumnDrop(issueId, col)
                      }
                    } else if (draggingIssueId) {
                      handleColumnDrop(draggingIssueId, col)
                    }
                  } catch {
                    if (draggingIssueId) {
                      handleColumnDrop(draggingIssueId, col)
                    }
                  }
                }}
                className={cn(
                  "flex flex-col rounded-xl border bg-card/40 min-h-[480px] shadow-2xs transition-all duration-150",
                  isOverThisColumn
                    ? "border-foreground ring-2 ring-foreground/20 bg-muted/40 shadow-sm"
                    : "border-border"
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3.5 py-2.5 select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    {col.avatarInitial ? (
                      <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                        {col.avatarInitial}
                      </div>
                    ) : (
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                    )}
                    <span className="text-xs font-semibold text-foreground truncate">
                      {col.title}
                    </span>
                    <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                      {col.issues.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    title={`Добавить задачу в "${col.title}"`}
                    onClick={() =>
                      handleOpenCreateModal(
                        col.defaultStateId || sortedStates[0]?.id,
                        col.priority,
                        col.assigneeId
                      )
                    }
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                {/* Column Issue Cards List */}
                <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
                  {/* Drop Placeholder Indicator */}
                  {isOverThisColumn && draggingIssueId && (
                    <div className="rounded-lg border-2 border-dashed border-foreground/40 bg-foreground/5 py-3 text-center text-xs font-medium text-foreground select-none animate-pulse">
                      Поместить в &laquo;{col.title}&raquo;
                    </div>
                  )}

                  {col.issues.length === 0 && !isOverThisColumn ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/60 rounded-lg bg-card/20 select-none">
                      <p className="text-xs text-muted-foreground/70">Нет задач</p>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenCreateModal(
                            col.defaultStateId || sortedStates[0]?.id,
                            col.priority,
                            col.assigneeId
                          )
                        }
                        className="mt-2 text-[11px] font-medium text-foreground hover:underline cursor-pointer"
                      >
                        + Создать
                      </button>
                    </div>
                  ) : (
                    col.issues.map((issue) => {
                      const curState =
                        states.find((s) => s.id === issue.state_id) || sortedStates[0]

                      return (
                        <KanbanCard
                          key={issue.id}
                          issue={issue}
                          projectIdentifier={projectIdentifier}
                          currentState={curState}
                          allStates={sortedStates}
                          availableMembers={availableMembers}
                          isDragging={draggingIssueId === issue.id}
                          onSelect={(iss) => setSelectedIssue(iss)}
                          onMoveState={handleMoveIssueState}
                          onDelete={handleRequestDelete}
                          onUpdateDueDate={handleUpdateDueDate}
                          onDragStart={(id) => setDraggingIssueId(id)}
                          onDragEnd={() => {
                            setDraggingIssueId(null)
                            setActiveDropColumnId(null)
                          }}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        key={`modal-create-${createModalState.instanceId}`}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projectIdentifier={projectIdentifier}
        states={sortedStates}
        members={availableMembers}
        initialStateId={createModalState.initialStateId}
        initialPriority={createModalState.initialPriority}
        initialAssigneeId={createModalState.initialAssigneeId}
        isOpen={createModalState.isOpen}
        onClose={() => setCreateModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* View & Edit Issue Detail Modal */}
      <IssueDetailModal
        key={selectedIssue ? selectedIssue.id : "detail-closed"}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projectIdentifier={projectIdentifier}
        issue={issues.find((i) => i.id === selectedIssue?.id) || selectedIssue}
        states={sortedStates}
        members={availableMembers}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onDelete={handleRequestDelete}
        onSelectIssue={(issue) => setSelectedIssue(issue)}
      />

      {/* Delete Issue Modal (MacModal) */}
      <DeleteIssueModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({
            isOpen: false,
            issueId: "",
            title: "",
            sequenceId: "",
          })
        }
        onConfirm={handleConfirmDelete}
        issueTitle={deleteModalState.title}
        issueKey={`${projectIdentifier}-${deleteModalState.sequenceId}`}
        isLoading={isDeleting}
      />

      {/* Workflow States Management Modal (MacModal) */}
      <WorkflowStatesModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projectIdentifier={projectIdentifier}
        states={states}
      />
    </div>
  )
}
