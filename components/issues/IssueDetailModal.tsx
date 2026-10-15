"use client"

import * as React from "react"
import {
  FileText,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useGetIssueQuery,
  useUpdateIssueMutation,
  useAddIssueAssigneeMutation,
  useRemoveIssueAssigneeMutation,
} from "@/redux/api/issueApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { MacModal } from "@/components/common/MacModal"
import { IssueLabels } from "./IssueLabels"
import { IssueComments } from "./IssueComments"
import { IssueRelations } from "./IssueRelations"
import type { Issue, IssuePriority, ProjectState } from "@/types/api"
import { extractAssigneeId, type ResolvedMember } from "./assigneeUtils"
import { cn } from "@/lib/utils"

export interface IssueDetailModalProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  issue: Issue | null
  states: ProjectState[]
  members: ResolvedMember[] | any[]
  isOpen: boolean
  onClose: () => void
  onDelete: (issueId: string, title: string) => void
}

export function IssueDetailModal({
  workspaceSlug,
  projectId,
  projectIdentifier,
  issue,
  states,
  members,
  isOpen,
  onClose,
  onDelete,
}: IssueDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<"properties" | "comments" | "relations">("properties")
  const [title, setTitle] = React.useState(issue?.title || "")
  const [description, setDescription] = React.useState(issue?.description || "")
  const [stateId, setStateId] = React.useState(issue?.state_id || "")
  const [priority, setPriority] = React.useState<IssuePriority>(issue?.priority || "none")
  const [assigneeId, setAssigneeId] = React.useState<string>(extractAssigneeId(issue))
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const [updateIssue, { isLoading: isUpdating }] = useUpdateIssueMutation()
  const [addAssignee, { isLoading: isAddingAssignee }] = useAddIssueAssigneeMutation()
  const [removeAssignee, { isLoading: isRemovingAssignee }] = useRemoveIssueAssigneeMutation()

  const { data: remoteIssue } = useGetIssueQuery(
    { workspaceSlug, projectId, issueId: issue?.id || "" },
    { skip: !isOpen || !issue?.id }
  )

  const activeIssue = remoteIssue || issue

  React.useEffect(() => {
    if (activeIssue) {
      setTitle(activeIssue.title)
      setDescription(activeIssue.description || "")
      setStateId(activeIssue.state_id)
      setPriority(activeIssue.priority)
      setAssigneeId(extractAssigneeId(activeIssue))
      setErrorMessage(null)
      setSaveSuccess(false)
    }
  }, [activeIssue?.id])

  if (!activeIssue) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSaveSuccess(false)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setErrorMessage("Введите заголовок задачи")
      return
    }

    try {
      // 1. Update issue core parameters
      await updateIssue({
        workspaceSlug,
        projectId,
        issueId: activeIssue.id,
        body: {
          title: trimmedTitle,
          description: description.trim() || null,
          state_id: stateId || activeIssue.state_id,
          priority,
        },
      }).unwrap()

      // 2. Handle assignee change
      const currentAssigneeIds: string[] = []
      if (Array.isArray(activeIssue.assignees)) {
        for (const a of activeIssue.assignees as any[]) {
          const uid = a.user_id || a.user?.id || a.id
          if (uid) currentAssigneeIds.push(String(uid))
        }
      }
      const fallbackId = extractAssigneeId(activeIssue)
      if (fallbackId && !currentAssigneeIds.includes(fallbackId)) {
        currentAssigneeIds.push(fallbackId)
      }

      if (assigneeId) {
        if (!currentAssigneeIds.includes(assigneeId)) {
          // Remove old assignees
          for (const oldId of currentAssigneeIds) {
            try {
              await removeAssignee({
                workspaceSlug,
                projectId,
                issueId: activeIssue.id,
                userId: oldId,
              }).unwrap()
            } catch {
              // Ignored
            }
          }
          // Add newly selected assignee
          await addAssignee({
            workspaceSlug,
            projectId,
            issueId: activeIssue.id,
            userId: assigneeId,
          }).unwrap()
        }
      } else if (currentAssigneeIds.length > 0) {
        for (const oldId of currentAssigneeIds) {
          try {
            await removeAssignee({
              workspaceSlug,
              projectId,
              issueId: activeIssue.id,
              userId: oldId,
            }).unwrap()
          } catch {
            // Ignored
          }
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const isSaving = isUpdating || isAddingAssignee || isRemovingAssignee

  const currentMember = members.find(
    (m) => String(m.user_id || m.id) === String(assigneeId)
  )

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Задача ${projectIdentifier}-${activeIssue.sequence_id}`}
      subtitle="Детали, обсуждение и связи"
      tag={`${projectIdentifier}-${activeIssue.sequence_id}`}
      defaultWidth="max-w-2xl sm:max-w-3xl"
      maximizedWidth="max-w-5xl"
    >
      {/* Modal Internal Navigation Tabs */}
      <div className="flex border-b border-border bg-muted/20 px-6 pt-2 gap-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("properties")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 border-b-2 -mb-px transition-colors cursor-pointer",
            activeTab === "properties"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="size-3.5" />
          <span>Параметры</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("comments")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 border-b-2 -mb-px transition-colors cursor-pointer",
            activeTab === "comments"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="size-3.5" />
          <span>Обсуждение</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("relations")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 border-b-2 -mb-px transition-colors cursor-pointer",
            activeTab === "relations"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <LinkIcon className="size-3.5" />
          <span>Связи</span>
        </button>
      </div>

      <div className="p-6 sm:p-7">
        {/* Tab 1: Properties & Edit */}
        {activeTab === "properties" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="detail-title" className="text-xs sm:text-sm font-medium">
                Заголовок задачи
              </Label>
              <Input
                id="detail-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                className="h-10 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail-desc" className="text-xs sm:text-sm font-medium">
                Описание задачи
              </Label>
              <textarea
                id="detail-desc"
                rows={4}
                placeholder="Добавьте подробное описание задачи..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-xs sm:text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring outline-hidden placeholder:text-muted-foreground resize-y min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="detail-state" className="text-xs sm:text-sm font-medium">
                  Статус воркфлоу
                </Label>
                <select
                  id="detail-state"
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  disabled={isSaving}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-priority" className="text-xs sm:text-sm font-medium">
                  Приоритет
                </Label>
                <select
                  id="detail-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  disabled={isSaving}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="none">Без приоритета</option>
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-assignee" className="text-xs sm:text-sm font-medium">
                  Исполнитель
                </Label>
                <select
                  id="detail-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={isSaving}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name || m.user?.display_name || m.email || m.user?.email || "Участник"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Assignee Indicator */}
            {currentMember && (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                <div className="size-6 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[10px] font-bold uppercase">
                  {(currentMember.display_name || currentMember.user?.display_name || currentMember.email || "U").charAt(0)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {currentMember.display_name || currentMember.user?.display_name || currentMember.email || currentMember.user?.email}
                  </span>
                  {currentMember.role && (
                    <span className="text-[10px] font-mono border border-border rounded px-1.5 py-0.2 bg-muted/40">
                      {currentMember.role}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Labels Manager */}
            <div className="pt-2 border-t border-border/60">
              <IssueLabels
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={activeIssue.id}
                attachedLabels={activeIssue.labels}
              />
            </div>

            {errorMessage && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
                {errorMessage}
              </div>
            )}

            {saveSuccess && (
              <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <span>Изменения сохранены</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(activeIssue.id, activeIssue.title)
                  onClose()
                }}
                className="h-9 px-3.5 text-xs font-medium gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Удалить задачу</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Закрыть
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    "Сохранить изменения"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Comments / Discussions */}
        {activeTab === "comments" && (
          <IssueComments
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={activeIssue.id}
          />
        )}

        {/* Tab 3: Relations */}
        {activeTab === "relations" && (
          <IssueRelations
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            projectIdentifier={projectIdentifier}
            issueId={activeIssue.id}
          />
        )}
      </div>
    </MacModal>
  )
}
