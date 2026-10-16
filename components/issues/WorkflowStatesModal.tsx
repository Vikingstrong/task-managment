"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Edit2,
  Loader2,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} from "@/redux/api/stateApi"
import { MacModal } from "@/components/common/MacModal"
import { getStateGroupIcon } from "./kanbanConstants"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { ProjectState, StateGroup } from "@/types/api"

export interface WorkflowStatesModalProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  states: ProjectState[]
  isOpen: boolean
  onClose: () => void
}

const PRESET_STATE_COLORS = [
  "#8e8e93", // Gray
  "#007aff", // Blue
  "#ffbd2e", // Yellow / Amber
  "#af52de", // Purple
  "#ff9500", // Orange
  "#27c93f", // Green
  "#ff5f56", // Red
  "#00c7be", // Teal
]

const LIFECYCLE_GROUPS: { group: StateGroup; label: string }[] = [
  { group: "backlog", label: "Бэклог (Backlog)" },
  { group: "unstarted", label: "Не начато (To Do)" },
  { group: "started", label: "В работе (In Progress)" },
  { group: "completed", label: "Завершено (Done)" },
  { group: "cancelled", label: "Отменено (Cancelled)" },
]

export function WorkflowStatesModal({
  workspaceSlug,
  projectId,
  projectIdentifier,
  states,
  isOpen,
  onClose,
}: WorkflowStatesModalProps) {
  const [createState, { isLoading: isCreating }] = useCreateStateMutation()
  const [updateState, { isLoading: isUpdating }] = useUpdateStateMutation()
  const [deleteState, { isLoading: isDeleting }] = useDeleteStateMutation()

  // Creation form state
  const [isCreatingNew, setIsCreatingNew] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newColor, setNewColor] = React.useState(PRESET_STATE_COLORS[0])
  const [newGroup, setNewGroup] = React.useState<StateGroup>("unstarted")

  // Editing state
  const [editingStateId, setEditingStateId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editColor, setEditColor] = React.useState("")
  const [editGroup, setEditGroup] = React.useState<StateGroup>("unstarted")

  // Safe delete dialog state
  const [deletingState, setDeletingState] = React.useState<ProjectState | null>(null)
  const [transferTargetId, setTransferTargetId] = React.useState<string>("")

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const sortedStates = React.useMemo(() => {
    return [...states].sort((a, b) => a.order - b.order)
  }, [states])

  React.useEffect(() => {
    if (!isOpen) {
      setIsCreatingNew(false)
      setEditingStateId(null)
      setDeletingState(null)
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  const handleStartEdit = (state: ProjectState) => {
    setEditingStateId(state.id)
    setEditName(state.name)
    setEditColor(state.color)
    setEditGroup(state.group)
    setErrorMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingStateId(null)
  }

  const handleSaveEdit = async (stateId: string) => {
    const trimmed = editName.trim()
    if (!trimmed) {
      setErrorMessage("Введите название статуса")
      return
    }
    setErrorMessage(null)

    try {
      await updateState({
        workspaceSlug,
        projectId,
        stateId,
        body: {
          name: trimmed,
          color: editColor,
          group: editGroup,
        },
      }).unwrap()

      setEditingStateId(null)
      setSuccessMessage("Статус успешно обновлен")
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) {
      setErrorMessage("Введите название статуса")
      return
    }
    setErrorMessage(null)

    try {
      const nextOrder =
        sortedStates.length > 0
          ? Math.max(...sortedStates.map((s) => s.order)) + 1
          : 0

      await createState({
        workspaceSlug,
        projectId,
        body: {
          name: trimmed,
          color: newColor,
          group: newGroup,
          order: nextOrder,
        },
      }).unwrap()

      setNewName("")
      setIsCreatingNew(false)
      setSuccessMessage("Новый статус добавлен в воркфлоу")
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sortedStates.length) return

    const current = sortedStates[index]
    const neighbor = sortedStates[targetIndex]
    if (!current || !neighbor) return

    setErrorMessage(null)
    try {
      // Swap order positions
      await updateState({
        workspaceSlug,
        projectId,
        stateId: current.id,
        body: { order: neighbor.order },
      }).unwrap()

      await updateState({
        workspaceSlug,
        projectId,
        stateId: neighbor.id,
        body: { order: current.order },
      }).unwrap()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleOpenDelete = (state: ProjectState) => {
    if (sortedStates.length <= 1) {
      setErrorMessage("Нельзя удалить единственный оставшийся статус проекта")
      return
    }
    const otherStates = sortedStates.filter((s) => s.id !== state.id)
    setDeletingState(state)
    setTransferTargetId(otherStates[0]?.id || "")
    setErrorMessage(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingState) return
    if (!transferTargetId) {
      setErrorMessage("Выберите статус для переноса задач")
      return
    }
    setErrorMessage(null)

    try {
      await deleteState({
        workspaceSlug,
        projectId,
        stateId: deletingState.id,
        transferToStateId: transferTargetId,
      }).unwrap()

      setDeletingState(null)
      setSuccessMessage(`Статус "${deletingState.name}" удален, задачи перенесены`)
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Статусы воркфлоу"
      subtitle={`Колонки и жизненный цикл проекта ${projectIdentifier}`}
      tag={`${sortedStates.length} колонок`}
      defaultWidth="max-w-2xl sm:max-w-3xl"
    >
      <div className="p-6 sm:p-7 space-y-6">
        {/* Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Top Header & Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5" />
              <span>Колонки канбан-доски</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Настройте порядок, цвета и этапы жизненного цикла задач
            </p>
          </div>

          {!isCreatingNew && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreatingNew(true)}
              className="h-8 px-3 text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Добавить статус</span>
            </Button>
          )}
        </div>

        {/* Add New State Form */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                Создание нового статуса
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-state-name" className="text-xs font-medium">
                  Название
                </Label>
                <Input
                  id="new-state-name"
                  type="text"
                  required
                  placeholder="Например, Code Review"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isCreating}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-state-group" className="text-xs font-medium">
                  Этап жизненного цикла
                </Label>
                <select
                  id="new-state-group"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as StateGroup)}
                  disabled={isCreating}
                  className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {LIFECYCLE_GROUPS.map((g) => (
                    <option key={g.group} value={g.group}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Цвет индикатора</Label>
              <div className="flex items-center gap-2">
                {PRESET_STATE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`size-5 rounded-full border transition-transform cursor-pointer ${
                      newColor === c
                        ? "scale-125 border-foreground ring-2 ring-foreground/20"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingNew(false)}
                disabled={isCreating}
                className="h-8 px-3 text-xs cursor-pointer"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !newName.trim()}
                className="h-8 px-3.5 text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>Создание...</span>
                  </>
                ) : (
                  "Создать статус"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* States List */}
        <div className="divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
          {sortedStates.map((state, index) => {
            const isEditing = editingStateId === state.id
            const isFirst = index === 0
            const isLast = index === sortedStates.length - 1

            if (isEditing) {
              return (
                <div key={state.id} className="p-3.5 bg-muted/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">Название</Label>
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={isUpdating}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">Жизненный цикл</Label>
                      <select
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value as StateGroup)}
                        disabled={isUpdating}
                        className="h-8 w-full rounded-md border border-input bg-card px-2.5 text-xs outline-hidden cursor-pointer"
                      >
                        {LIFECYCLE_GROUPS.map((g) => (
                          <option key={g.group} value={g.group}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground mr-1">Цвет:</span>
                      {PRESET_STATE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`size-4 rounded-full border transition-transform cursor-pointer ${
                            editColor === c ? "scale-125 border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="h-7 px-2.5 text-xs cursor-pointer"
                      >
                        Отмена
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(state.id)}
                        disabled={isUpdating || !editName.trim()}
                        className="h-7 px-3 text-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                      >
                        {isUpdating ? <Loader2 className="size-3 animate-spin" /> : "Сохранить"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={state.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst || isUpdating}
                      onClick={() => handleMoveOrder(index, "up")}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Переместить вверх"
                    >
                      <ArrowUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || isUpdating}
                      onClick={() => handleMoveOrder(index, "down")}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Переместить вниз"
                    >
                      <ArrowDown className="size-3" />
                    </button>
                  </div>

                  {/* Dot & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: state.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate">
                      {state.name}
                    </span>
                    {state.is_default && (
                      <span className="text-[10px] font-mono border border-border px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground">
                        по умолчанию
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Group indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                    {getStateGroupIcon(state.group)}
                    <span className="hidden sm:inline capitalize">{state.group}</span>
                  </div>

                  {/* Edit & Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(state)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      title="Редактировать статус"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(state)}
                      disabled={sortedStates.length <= 1}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Удалить статус с переносом задач"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Safe Deletion Prompt Dialog */}
        {deletingState && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">
                  Удаление статуса «{deletingState.name}»
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Все задачи, находящиеся в этой колонке, должны быть безопасно
                  перенесены в другой статус.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-medium">
                Куда перенести существующие задачи?
              </Label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                disabled={isDeleting}
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {sortedStates
                  .filter((s) => s.id !== deletingState.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.group})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-destructive/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingState(null)}
                disabled={isDeleting}
                className="h-8 px-3 text-xs cursor-pointer"
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting || !transferTargetId}
                className="h-8 px-3.5 text-xs gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>Удаление...</span>
                  </>
                ) : (
                  "Удалить и перенести"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Закрыть
          </Button>
        </div>
      </div>
    </MacModal>
  )
}
