"use client"

import * as React from "react"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MacModal } from "@/components/common/MacModal"
import { useGetIssuesQuery } from "@/redux/api/issueApi"
import {
  useAddModuleIssuesMutation,
  useRemoveModuleIssueMutation,
} from "@/redux/api/moduleApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { Module } from "@/types/api"

interface ModuleIssuesModalProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  module: Module | null
  isOpen: boolean
  onClose: () => void
}

export function ModuleIssuesModal({
  workspaceSlug,
  projectId,
  projectIdentifier,
  module,
  isOpen,
  onClose,
}: ModuleIssuesModalProps) {
  // 1. Fetch issues assigned to this specific module directly from backend
  const { data: moduleIssues = [], isLoading: isLoadingModuleIssues } = useGetIssuesQuery(
    {
      workspaceSlug,
      projectId,
      module: module?.id,
    },
    { skip: !module?.id || !isOpen }
  )

  // 2. Fetch all project issues to find candidates
  const { data: allIssues = [], isLoading: isLoadingAll } = useGetIssuesQuery(
    {
      workspaceSlug,
      projectId,
    },
    { skip: !isOpen }
  )

  const isLoadingIssues = isLoadingModuleIssues || isLoadingAll

  const [addIssues, { isLoading: isAdding }] = useAddModuleIssuesMutation()
  const [removeIssue, { isLoading: isRemoving }] = useRemoveModuleIssueMutation()

  const [selectedIssueIds, setSelectedIssueIds] = React.useState<string[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // IDs of issues already in this module
  const moduleIssueIds = React.useMemo(() => {
    return new Set(moduleIssues.map((i) => i.id))
  }, [moduleIssues])

  // Available issues not currently in this module
  const candidateIssues = React.useMemo(() => {
    return allIssues.filter((i) => !moduleIssueIds.has(i.id))
  }, [allIssues, moduleIssueIds])

  React.useEffect(() => {
    setSelectedIssueIds([])
    setErrorMessage(null)
  }, [isOpen, module])

  if (!module) return null

  const handleToggleSelect = (id: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAddSelected = async () => {
    if (selectedIssueIds.length === 0) return
    setErrorMessage(null)

    try {
      await addIssues({
        workspaceSlug,
        projectId,
        moduleId: module.id,
        issue_ids: selectedIssueIds,
      }).unwrap()

      setSelectedIssueIds([])
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleRemove = async (issueId: string) => {
    setErrorMessage(null)
    try {
      await removeIssue({
        workspaceSlug,
        projectId,
        moduleId: module.id,
        issueId,
      }).unwrap()
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Задачи модуля: ${module.name}`}
      subtitle="Связывание задач проекта с инициативой"
      tag="Module Issues"
      defaultWidth="max-w-xl sm:max-w-2xl"
    >
      <div className="p-6 space-y-5">
        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        {/* Current Module Issues */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Задачи в модуле ({moduleIssues.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {moduleIssues.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                В этот модуль пока не добавлено ни одной задачи
              </p>
            ) : (
              moduleIssues.map((iss) => (
                <div
                  key={iss.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                      {projectIdentifier}-{iss.sequence_id}
                    </span>
                    <span className="text-foreground truncate">{iss.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(iss.id)}
                    disabled={isRemoving}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Исключить из модуля"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Candidates from Project */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Добавить задачи в модуль
            </h4>
            {selectedIssueIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleAddSelected}
                disabled={isAdding}
                className="h-7 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 gap-1 cursor-pointer"
              >
                {isAdding ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-3" />
                    <span>Добавить выбранные ({selectedIssueIds.length})</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {isLoadingIssues ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : candidateIssues.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                Все задачи проекта уже распределены
              </p>
            ) : (
              candidateIssues.map((iss) => {
                const isSelected = selectedIssueIds.includes(iss.id)
                return (
                  <button
                    key={iss.id}
                    type="button"
                    onClick={() => handleToggleSelect(iss.id)}
                    className="w-full flex items-center justify-between rounded-md border border-border/70 hover:border-foreground/40 bg-card px-3 py-2 text-xs transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                        {projectIdentifier}-{iss.sequence_id}
                      </span>
                      <span className="text-foreground truncate">{iss.title}</span>
                    </div>
                    <div
                      className={`size-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                        isSelected
                          ? "bg-foreground text-background border-foreground"
                          : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs cursor-pointer"
          >
            Закрыть
          </Button>
        </div>
      </div>
    </MacModal>
  )
}
