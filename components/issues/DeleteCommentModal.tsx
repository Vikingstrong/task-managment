"use client"

import * as React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MacModal } from "@/components/common/MacModal"

export interface DeleteCommentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  commentSnippet?: string
  isLoading?: boolean
}

export function DeleteCommentModal({
  isOpen,
  onClose,
  onConfirm,
  commentSnippet,
  isLoading = false,
}: DeleteCommentModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Удаление комментария"
      subtitle="Удаление сообщения из обсуждения"
      tag="Comment"
      defaultWidth="max-w-md sm:max-w-lg"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl border border-destructive/20 bg-destructive/10 flex items-center justify-center shrink-0 text-destructive shadow-2xs">
            <AlertTriangle className="size-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Вы уверены, что хотите удалить комментарий?
            </h3>
            {commentSnippet ? (
              <p className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-3 italic bg-muted/30 p-2 rounded border border-border/60">
                &laquo;{commentSnippet}&raquo;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Это действие удалит комментарий из ветки обсуждения задачи.
              </p>
            )}
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
                <span>Удалить</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </MacModal>
  )
}
