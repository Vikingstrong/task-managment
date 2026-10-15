"use client"

import * as React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MacModal } from "@/components/common/MacModal"

export interface DeleteCycleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  cycleName: string
  isLoading?: boolean
}

export function DeleteCycleModal({
  isOpen,
  onClose,
  onConfirm,
  cycleName,
  isLoading = false,
}: DeleteCycleModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Удаление спринта"
      subtitle="Безвозвратное удаление спринта"
      tag="Sprint"
      defaultWidth="max-w-md sm:max-w-lg"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl border border-destructive/20 bg-destructive/10 flex items-center justify-center shrink-0 text-destructive shadow-2xs">
            <AlertTriangle className="size-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Вы уверены, что хотите удалить спринт?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              Спринт <span className="font-semibold text-foreground">&laquo;{cycleName}&raquo;</span> будет удален. Задачи из этого спринта не удалятся, а вернутся в общий пул проекта.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Отмена
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium gap-1.5 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Удалить спринт</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </MacModal>
  )
}
