"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MacModal } from "@/components/common/MacModal"
import { useCreateCycleMutation } from "@/redux/api/cycleApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"

interface CreateCycleModalProps {
  workspaceSlug: string
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function CreateCycleModal({
  workspaceSlug,
  projectId,
  isOpen,
  onClose,
}: CreateCycleModalProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [createCycle, { isLoading }] = useCreateCycleMutation()

  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Введите название спринта")
      return
    }

    try {
      await createCycle({
        workspaceSlug,
        projectId,
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
      title="Новый спринт (Cycle)"
      subtitle="Планирование итерации разработки"
      tag="Sprint"
      defaultWidth="max-w-md sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cycle-name" className="text-xs sm:text-sm font-medium">
            Название спринта
          </Label>
          <Input
            id="cycle-name"
            type="text"
            required
            placeholder="Например: Спринт 1 или Q1 Release"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cycle-desc" className="text-xs sm:text-sm font-medium">
            Описание (опционально)
          </Label>
          <textarea
            id="cycle-desc"
            rows={2}
            placeholder="Цели спринта или фокус разработки..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring resize-y placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="cycle-start" className="text-xs sm:text-sm font-medium">
              Дата начала
            </Label>
            <Input
              id="cycle-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cycle-end" className="text-xs sm:text-sm font-medium">
              Дата окончания
            </Label>
            <Input
              id="cycle-end"
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
                <span>Создание...</span>
              </div>
            ) : (
              "Создать спринт"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
