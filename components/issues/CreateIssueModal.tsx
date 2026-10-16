"use client"

import * as React from "react"
import { Calendar, Loader2, Subtitles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateIssueMutation, useGetIssuesQuery } from "@/redux/api/issueApi"
import { useGetLabelsQuery } from "@/redux/api/labelApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { MacModal } from "@/components/common/MacModal"
import type { IssuePriority, ProjectState } from "@/types/api"
import type { ResolvedMember } from "./assigneeUtils"

export interface CreateIssueModalProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  states: ProjectState[]
  members: ResolvedMember[] | any[]
  initialStateId?: string
  isOpen: boolean
  onClose: () => void
}

export function CreateIssueModal({
  workspaceSlug,
  projectId,
  projectIdentifier,
  states,
  members,
  initialStateId,
  isOpen,
  onClose,
}: CreateIssueModalProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [stateId, setStateId] = React.useState(initialStateId || states[0]?.id || "")
  const [priority, setPriority] = React.useState<IssuePriority>("none")
  const [assigneeId, setAssigneeId] = React.useState<string>("")
  const [startDate, setStartDate] = React.useState<string>("")
  const [dueDate, setDueDate] = React.useState<string>("")
  const [estimatePoints, setEstimatePoints] = React.useState<string>("")
  const [parentId, setParentId] = React.useState<string>("")
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const { data: projectLabels = [] } = useGetLabelsQuery(
    { workspaceSlug, projectId },
    { skip: !isOpen }
  )

  const { data: projectIssues = [] } = useGetIssuesQuery(
    { workspaceSlug, projectId },
    { skip: !isOpen }
  )

  const [createIssue, { isLoading: isCreating }] = useCreateIssueMutation()

  React.useEffect(() => {
    if (isOpen) {
      setTitle("")
      setDescription("")
      setStateId(initialStateId || states[0]?.id || "")
      setPriority("none")
      setAssigneeId("")
      setStartDate("")
      setDueDate("")
      setEstimatePoints("")
      setParentId("")
      setSelectedLabelIds([])
      setErrorMessage(null)
    }
  }, [isOpen, initialStateId, states])

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setErrorMessage("Введите заголовок задачи")
      return
    }

    const targetStateId = stateId || states[0]?.id
    if (!targetStateId) {
      setErrorMessage("Выберите статус задачи")
      return
    }

    try {
      await createIssue({
        workspaceSlug,
        projectId,
        body: {
          title: trimmedTitle,
          description: description.trim() || null,
          state_id: targetStateId,
          priority,
          assignee_ids: assigneeId ? [assigneeId] : [],
          label_ids: selectedLabelIds,
          parent_id: parentId || null,
          start_date: startDate || null,
          due_date: dueDate || null,
          estimate_points: estimatePoints !== "" ? Number(estimatePoints) : null,
        },
      }).unwrap()

      onClose()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      id="modal-new-issue"
      isOpen={isOpen}
      onClose={onClose}
      title="Новая задача"
      subtitle={`Создание задачи в проекте ${projectIdentifier}`}
      tag={projectIdentifier}
      defaultWidth="max-w-2xl sm:max-w-3xl"
      maximizedWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="issue-title" className="text-xs sm:text-sm font-medium">
            Заголовок задачи
          </Label>
          <Input
            id="issue-title"
            type="text"
            required
            autoFocus
            placeholder="Что нужно сделать?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isCreating}
            className="h-10 text-xs sm:text-sm font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="issue-desc" className="text-xs sm:text-sm font-medium">
            Описание задачи (опционально)
          </Label>
          <textarea
            id="issue-desc"
            rows={4}
            placeholder="Подробности, требования, критерии приемки или контекст..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-xs sm:text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring outline-hidden placeholder:text-muted-foreground resize-y min-h-[90px]"
          />
        </div>

        {/* State, Priority, Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="issue-state" className="text-xs sm:text-sm font-medium">
              Статус воркфлоу
            </Label>
            <select
              id="issue-state"
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
              disabled={isCreating}
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
            <Label htmlFor="issue-priority" className="text-xs sm:text-sm font-medium">
              Приоритет
            </Label>
            <select
              id="issue-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              disabled={isCreating}
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
            <Label htmlFor="issue-assignee" className="text-xs sm:text-sm font-medium">
              Исполнитель
            </Label>
            <select
              id="issue-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={isCreating}
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

        {/* Start Date, Due Date, Estimate Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="issue-start-date" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />
              <span>Дата начала</span>
            </Label>
            <Input
              id="issue-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isCreating}
              className="h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issue-due-date" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />
              <span>Срок (дедлайн)</span>
            </Label>
            <Input
              id="issue-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isCreating}
              className="h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issue-estimate" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Zap className="size-3 text-muted-foreground" />
              <span>Оценка (Points)</span>
            </Label>
            <Input
              id="issue-estimate"
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="0"
              value={estimatePoints}
              onChange={(e) => setEstimatePoints(e.target.value)}
              disabled={isCreating}
              className="h-10 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Parent Task Selector */}
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="issue-parent" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
            <Subtitles className="size-3 text-muted-foreground" />
            <span>Родительская задача</span>
          </Label>
          <select
            id="issue-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={isCreating}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">Без родительской задачи (основная задача)</option>
            {projectIssues.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {projectIdentifier}-{cand.sequence_id}: {cand.title}
              </option>
            ))}
          </select>
        </div>

        {/* Labels Selection */}
        {projectLabels.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs sm:text-sm font-medium">Метки задачи</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {projectLabels.map((lbl) => {
                const isSelected = selectedLabelIds.includes(lbl.id)
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-foreground bg-muted text-foreground shadow-2xs font-semibold"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: lbl.color }}
                    />
                    <span>{lbl.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isCreating}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isCreating}
            className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Создание...</span>
              </>
            ) : (
              "Создать задачу"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
