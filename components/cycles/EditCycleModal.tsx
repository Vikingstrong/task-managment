"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MacModal } from "@/components/common/MacModal"
import { useUpdateCycleMutation } from "@/redux/api/cycleApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { Cycle } from "@/types/api"

interface EditCycleModalProps {
  workspaceSlug: string
  projectId: string
  cycle: Cycle | null
  isOpen: boolean
  onClose: () => void
}

export function EditCycleModal({
  workspaceSlug,
  projectId,
  cycle,
  isOpen,
  onClose,
}: EditCycleModalProps) {
  const [name, setName] = React.useState(cycle?.name || "")
  const [description, setDescription] = React.useState(cycle?.description || "")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [updateCycle, { isLoading }] = useUpdateCycleMutation()

  React.useEffect(() => {
    if (cycle) {
      setName(cycle.name)
      setDescription(cycle.description || "")
      setStartDate(cycle.start_date ? cycle.start_date.split("T")[0] : "")
      setEndDate(cycle.end_date ? cycle.end_date.split("T")[0] : "")
      setErrorMessage(null)
    }
  }, [cycle])

  if (!cycle) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Введите название спринта")
      return
    }

    try {
      await updateCycle({
        workspaceSlug,
        projectId,
        cycleId: cycle.id,
        name: trimmedName,
        description: description.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      }).unwrap()

      onClose()
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактирование спринта"
      subtitle={cycle.name}
      tag="Sprint"
      defaultWidth="max-w-md sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-cycle-name" className="text-xs sm:text-sm font-medium">
            Название спринта
          </Label>
          <Input
            id="edit-cycle-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-cycle-desc" className="text-xs sm:text-sm font-medium">
            Описание
          </Label>
          <textarea
            id="edit-cycle-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="edit-cycle-start" className="text-xs sm:text-sm font-medium">
              Дата начала
            </Label>
            <Input
              id="edit-cycle-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-cycle-end" className="text-xs sm:text-sm font-medium">
              Дата окончания
            </Label>
            <Input
              id="edit-cycle-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-3.5 text-xs cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !name.trim()}
            className="h-9 px-4 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Сохранение...</span>
              </div>
            ) : (
              "Сохранить"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
