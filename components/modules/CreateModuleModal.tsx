"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MacModal } from "@/components/common/MacModal"
import { useCreateModuleMutation } from "@/redux/api/moduleApi"
import { useGetProjectMembersQuery } from "@/redux/api/projectApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { ModuleStatus } from "@/types/api"

interface CreateModuleModalProps {
  workspaceSlug: string
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function CreateModuleModal({
  workspaceSlug,
  projectId,
  isOpen,
  onClose,
}: CreateModuleModalProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<ModuleStatus>("in_progress")
  const [leadId, setLeadId] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [targetDate, setTargetDate] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const { data: members = [] } = useGetProjectMembersQuery({
    workspaceSlug,
    projectId,
  })

  const [createModule, { isLoading }] = useCreateModuleMutation()

  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setDescription("")
      setStatus("in_progress")
      setLeadId("")
      setStartDate("")
      setTargetDate("")
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Введите название модуля")
      return
    }

    try {
      await createModule({
        workspaceSlug,
        projectId,
        name: trimmedName,
        description: description.trim() || null,
        status,
        lead_id: leadId || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        target_date: targetDate ? new Date(targetDate).toISOString() : null,
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
      title="Новый модуль (Epic / Roadmap)"
      subtitle="Группировка ключевых фич и инициатив"
      tag="Module"
      defaultWidth="max-w-md sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="module-name" className="text-xs sm:text-sm font-medium">
            Название модуля
          </Label>
          <Input
            id="module-name"
            type="text"
            required
            placeholder="Например: Аутентификация 2.0 или Платежный шлюз"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="module-desc" className="text-xs sm:text-sm font-medium">
            Описание (опционально)
          </Label>
          <textarea
            id="module-desc"
            rows={2}
            placeholder="Краткое описание инициативы и ожидаемых результатов..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring resize-y placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="module-status" className="text-xs sm:text-sm font-medium">
              Статус
            </Label>
            <select
              id="module-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ModuleStatus)}
              disabled={isLoading}
              className="h-9 w-full rounded-md border border-input bg-card px-2 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="backlog">Бэклог</option>
              <option value="in_progress">В работе</option>
              <option value="paused">Приостановлен</option>
              <option value="completed">Завершен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module-lead" className="text-xs sm:text-sm font-medium">
              Ответственный лид
            </Label>
            <select
              id="module-lead"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              disabled={isLoading}
              className="h-9 w-full rounded-md border border-input bg-card px-2 text-xs outline-hidden focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="">Не назначен</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.display_name || m.user?.email || "Участник"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="module-start" className="text-xs sm:text-sm font-medium">
              Дата старта
            </Label>
            <Input
              id="module-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module-target" className="text-xs sm:text-sm font-medium">
              Целевой срок
            </Label>
            <Input
              id="module-target"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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
              "Создать модуль"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
