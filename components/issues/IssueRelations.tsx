"use client"

import * as React from "react"
import {
  AlertCircle,
  Copy,
  GitCommit,
  Link as LinkIcon,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  useGetRelationsQuery,
  useCreateRelationMutation,
  useDeleteRelationMutation,
} from "@/redux/api/relationApi"
import { useGetIssuesQuery } from "@/redux/api/issueApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { IssueRelation, RelationType } from "@/types/api"

interface IssueRelationsProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  issueId: string
}

const RELATION_TYPE_CONFIG: Record<
  RelationType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  blocks: { label: "Блокирует", icon: ShieldAlert },
  blocked_by: { label: "Блокируется задачей", icon: AlertCircle },
  relates_to: { label: "Связана с", icon: GitCommit },
  duplicates: { label: "Дублирует", icon: Copy },
}

export function IssueRelations({
  workspaceSlug,
  projectId,
  projectIdentifier,
  issueId,
}: IssueRelationsProps) {
  const { data: relations, isLoading } = useGetRelationsQuery({
    workspaceSlug,
    projectId,
    issueId,
  })

  const { data: projectIssues = [] } = useGetIssuesQuery({
    workspaceSlug,
    projectId,
  })

  const [createRelation, { isLoading: isCreating }] = useCreateRelationMutation()
  const [deleteRelation, { isLoading: isDeleting }] = useDeleteRelationMutation()

  const [isAdding, setIsAdding] = React.useState(false)
  const [selectedIssueId, setSelectedIssueId] = React.useState("")
  const [relationType, setRelationType] = React.useState<RelationType>("blocks")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Candidate issues for linking (exclude current issue)
  const availableIssues = React.useMemo(() => {
    return projectIssues.filter((i) => i.id !== issueId)
  }, [projectIssues, issueId])

  const allRelations = React.useMemo(() => {
    if (!relations) return []
    const list: IssueRelation[] = []
    if (relations.blocks) list.push(...relations.blocks)
    if (relations.blocked_by) list.push(...relations.blocked_by)
    if (relations.relates_to) list.push(...relations.relates_to)
    if (relations.duplicates) list.push(...relations.duplicates)
    return list
  }, [relations])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssueId) return
    setErrorMessage(null)

    try {
      await createRelation({
        workspaceSlug,
        projectId,
        issueId,
        related_issue_id: selectedIssueId,
        relation_type: relationType,
      }).unwrap()

      setSelectedIssueId("")
      setIsAdding(false)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleDelete = async (linkId: string) => {
    setErrorMessage(null)
    try {
      await deleteRelation({
        workspaceSlug,
        projectId,
        issueId,
        linkId,
      }).unwrap()
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
          <LinkIcon className="size-3.5 text-muted-foreground" />
          <span>Связи и блокировки</span>
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus className="size-3" />
            <span>Добавить связь</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      {/* Add Relation Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-border bg-card p-3 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>Новая связь с задачей</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Тип связи</label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value as RelationType)}
                className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="blocks">Блокирует</option>
                <option value="blocked_by">Блокируется задачей</option>
                <option value="relates_to">Связана с</option>
                <option value="duplicates">Дублирует</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Связанная задача</label>
              <select
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                required
                className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Выберите задачу...</option>
                {availableIssues.map((iss) => (
                  <option key={iss.id} value={iss.id}>
                    {projectIdentifier}-{iss.sequence_id}: {iss.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-7 px-2 text-xs cursor-pointer"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating || !selectedIssueId}
              className="h-7 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
            >
              {isCreating ? <Loader2 className="size-3 animate-spin" /> : "Связать"}
            </Button>
          </div>
        </form>
      )}

      {/* Relations List */}
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : allRelations.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/10 p-3 text-center text-xs text-muted-foreground">
            Нет связанных задач или блокировок
          </div>
        ) : (
          allRelations.map((rel) => {
            const config = RELATION_TYPE_CONFIG[rel.relation_type] || {
              label: rel.relation_type,
              icon: GitCommit,
            }
            const Icon = config.icon

            return (
              <div
                key={rel.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground text-[11px] shrink-0">
                    {config.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {projectIdentifier}-{rel.related_issue?.sequence_id}:
                  </span>
                  <span className="truncate text-foreground/90 text-[11px]">
                    {rel.related_issue?.title || "Задача"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(rel.id)}
                  disabled={isDeleting}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2 shrink-0 cursor-pointer"
                  title="Удалить связь"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
