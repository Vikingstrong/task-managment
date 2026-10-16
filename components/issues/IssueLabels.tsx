"use client"

import * as React from "react"
import { Check, Edit2, Loader2, Plus, Tag, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useGetLabelsQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
  useAttachLabelToIssueMutation,
  useDetachLabelFromIssueMutation,
} from "@/redux/api/labelApi"
import { DeleteLabelModal } from "./DeleteLabelModal"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { ProjectLabel } from "@/types/api"

interface IssueLabelsProps {
  workspaceSlug: string
  projectId: string
  issueId: string
  attachedLabels?: ProjectLabel[] | { id?: string; label_id?: string; label?: ProjectLabel }[]
}

const PRESET_COLORS = [
  "#64748b", // Slate
  "#6b7280", // Gray
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
]

export function IssueLabels({
  workspaceSlug,
  projectId,
  issueId,
  attachedLabels = [],
}: IssueLabelsProps) {
  const { data: projectLabels = [], isLoading: isLoadingLabels } = useGetLabelsQuery({
    workspaceSlug,
    projectId,
  })

  const [attachLabel, { isLoading: isAttaching }] = useAttachLabelToIssueMutation()
  const [detachLabel, { isLoading: isDetaching }] = useDetachLabelFromIssueMutation()
  const [createLabel, { isLoading: isCreating }] = useCreateLabelMutation()
  const [updateLabel, { isLoading: isUpdatingLabel }] = useUpdateLabelMutation()
  const [deleteLabel, { isLoading: isDeletingLabel }] = useDeleteLabelMutation()

  const [isOpen, setIsOpen] = React.useState(false)
  const [isCreatingNew, setIsCreatingNew] = React.useState(false)
  const [newLabelName, setNewLabelName] = React.useState("")
  const [newLabelColor, setNewLabelColor] = React.useState(PRESET_COLORS[0])

  const [editingLabelId, setEditingLabelId] = React.useState<string | null>(null)
  const [editLabelName, setEditLabelName] = React.useState("")
  const [editLabelColor, setEditLabelColor] = React.useState(PRESET_COLORS[0])

  const [deletingLabel, setDeletingLabel] = React.useState<ProjectLabel | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [localAttached, setLocalAttached] = React.useState<any[]>(attachedLabels || [])

  React.useEffect(() => {
    setLocalAttached(attachedLabels || [])
  }, [attachedLabels])

  // Resolve attached label IDs
  const attachedIds = React.useMemo(() => {
    return new Set(
      localAttached.map((l: any) => l.id || l.label_id || l.label?.id).filter(Boolean)
    )
  }, [localAttached])

  // Resolve attached labels with full object details
  const activeLabels = React.useMemo(() => {
    const list: ProjectLabel[] = []
    for (const pl of projectLabels) {
      if (attachedIds.has(pl.id)) {
        list.push(pl)
      }
    }
    // Also include any attached labels from issue that may not be in projectLabels query yet
    for (const al of localAttached as any[]) {
      const fullLabel = al.label || (al.name ? al : null)
      if (fullLabel && !list.some((x) => x.id === fullLabel.id)) {
        list.push(fullLabel)
      }
    }
    return list
  }, [projectLabels, attachedIds, localAttached])

  const handleToggleLabel = async (label: ProjectLabel) => {
    setErrorMessage(null)
    const isAttached = attachedIds.has(label.id)

    // Optimistic update
    if (isAttached) {
      setLocalAttached((prev) =>
        prev.filter((l: any) => (l.id || l.label_id || l.label?.id) !== label.id)
      )
    } else {
      setLocalAttached((prev) => [...prev, label])
    }

    try {
      if (isAttached) {
        await detachLabel({
          workspaceSlug,
          projectId,
          issueId,
          labelId: label.id,
        }).unwrap()
      } else {
        await attachLabel({
          workspaceSlug,
          projectId,
          issueId,
          label_id: label.id,
        }).unwrap()
      }
    } catch (err) {
      setLocalAttached(attachedLabels || [])
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleCreateLabel = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const trimmed = newLabelName.trim()
    if (!trimmed) return
    setErrorMessage(null)

    try {
      const created = await createLabel({
        workspaceSlug,
        projectId,
        name: trimmed,
        color: newLabelColor || PRESET_COLORS[0],
      }).unwrap()

      const createdObj = (created as any)?.data || created

      if (createdObj?.id) {
        setLocalAttached((prev) => [...prev, createdObj])

        // Automatically attach the newly created label
        await attachLabel({
          workspaceSlug,
          projectId,
          issueId,
          label_id: createdObj.id,
        }).unwrap()
      }

      setNewLabelName("")
      setIsCreatingNew(false)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleStartEditLabel = (lbl: ProjectLabel) => {
    setEditingLabelId(lbl.id)
    setEditLabelName(lbl.name)
    setEditLabelColor(lbl.color)
    setErrorMessage(null)
  }

  const handleCancelEditLabel = () => {
    setEditingLabelId(null)
  }

  const handleSaveEditLabel = async (labelId: string) => {
    const trimmed = editLabelName.trim()
    if (!trimmed) return
    setErrorMessage(null)
    try {
      await updateLabel({
        workspaceSlug,
        projectId,
        labelId,
        name: trimmed,
        color: editLabelColor,
      }).unwrap()
      setEditingLabelId(null)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleConfirmDeleteLabel = async () => {
    if (!deletingLabel) return
    setErrorMessage(null)
    try {
      await deleteLabel({
        workspaceSlug,
        projectId,
        labelId: deletingLabel.id,
      }).unwrap()
      setDeletingLabel(null)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
          <Tag className="size-3.5 text-muted-foreground" />
          <span>Метки задачи</span>
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isOpen ? "Скрыть" : "+ Управление метками"}
        </button>
      </div>

      {/* Active Labels Badges */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
        {activeLabels.length === 0 ? (
          <span className="text-xs text-muted-foreground/70 italic">Метки не выбраны</span>
        ) : (
          activeLabels.map((lbl) => (
            <span
              key={lbl.id}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border border-border bg-muted/40 text-foreground transition-colors"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: lbl.color }}
              />
              <span>{lbl.name}</span>
              <button
                type="button"
                onClick={() => handleToggleLabel(lbl)}
                disabled={isDetaching}
                className="ml-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      {/* Labels Selector Dropdown / Panel */}
      {isOpen && (
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>Выберите метки для задачи</span>
            {!isCreatingNew && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Создать новую</span>
              </button>
            )}
          </div>

          {/* New Label Creation Form */}
          {isCreatingNew && (
            <div className="space-y-2 rounded-md border border-border/80 bg-muted/20 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Новая метка</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
              <Input
                type="text"
                placeholder="Название метки (например, Баг, Рефакторинг)"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCreateLabel(e)
                  }
                }}
                disabled={isCreating}
                required
                className="h-8 text-xs"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Цвет:</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLabelColor(c)}
                    className={`size-4 rounded-full border transition-transform cursor-pointer ${
                      newLabelColor === c ? "scale-125 border-foreground ring-1 ring-foreground/20" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingNew(false)}
                  className="h-7 px-2 text-xs cursor-pointer"
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCreateLabel(e)
                  }}
                  disabled={isCreating || !newLabelName.trim()}
                  className="h-7 px-2.5 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
                >
                  {isCreating ? <Loader2 className="size-3 animate-spin" /> : "Создать и добавить"}
                </Button>
              </div>
            </div>
          )}

          {/* Project Labels List */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {isLoadingLabels ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              </div>
            ) : projectLabels.length === 0 && !isCreatingNew ? (
              <p className="text-[11px] text-muted-foreground text-center py-2">
                В этом проекте пока нет меток
              </p>
            ) : (
              projectLabels.map((lbl) => {
                const isSelected = attachedIds.has(lbl.id)
                const isEditing = editingLabelId === lbl.id

                if (isEditing) {
                  return (
                    <div
                      key={lbl.id}
                      className="p-2 rounded-md border border-border/80 bg-muted/30 space-y-2 text-xs"
                    >
                      <Input
                        type="text"
                        value={editLabelName}
                        onChange={(e) => setEditLabelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSaveEditLabel(lbl.id)
                          }
                        }}
                        disabled={isUpdatingLabel}
                        className="h-7 text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditLabelColor(c)}
                              className={`size-3.5 rounded-full border transition-transform cursor-pointer ${
                                editLabelColor === c
                                  ? "scale-125 border-foreground"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditLabel}
                            disabled={isUpdatingLabel}
                            className="h-6 px-2 text-[10px] cursor-pointer"
                          >
                            Отмена
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEditLabel(lbl.id)}
                            disabled={isUpdatingLabel || !editLabelName.trim()}
                            className="h-6 px-2.5 text-[10px] bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                          >
                            {isUpdatingLabel ? (
                              <Loader2 className="size-2.5 animate-spin" />
                            ) : (
                              "Сохранить"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={lbl.id}
                    className="group/item flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleLabel(lbl)}
                      disabled={isAttaching || isDetaching}
                      className="flex-1 flex items-center gap-2 cursor-pointer text-left min-w-0"
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span className="text-foreground truncate">{lbl.name}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && <Check className="size-3.5 text-foreground" />}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEditLabel(lbl)
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-opacity cursor-pointer ml-1"
                        title="Редактировать метку"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingLabel(lbl)
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                        title="Удалить метку из проекта"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <DeleteLabelModal
        isOpen={!!deletingLabel}
        onClose={() => setDeletingLabel(null)}
        onConfirm={handleConfirmDeleteLabel}
        labelName={deletingLabel?.name || ""}
        labelColor={deletingLabel?.color}
        isLoading={isDeletingLabel}
      />
    </div>
  )
}
