"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Check,
  FolderKanban,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Shield,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MacModal } from "@/components/common/MacModal"
import { useGetInviteQuery, useAcceptInviteMutation } from "@/redux/api/inviteApi"
import { extractInviteToken, removeLocalPendingInvite } from "@/lib/invites"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"

export interface JoinByInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (workspaceSlug: string) => void
}

export function JoinByInviteModal({
  isOpen,
  onClose,
  onSuccess,
}: JoinByInviteModalProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const extractedToken = React.useMemo(() => {
    return extractInviteToken(inputValue)
  }, [inputValue])

  const {
    data: invite,
    isLoading: isChecking,
    isError: isInviteError,
    error: inviteError,
  } = useGetInviteQuery(extractedToken, {
    skip: !isOpen || !extractedToken,
  })

  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation()

  React.useEffect(() => {
    if (isOpen) {
      setInputValue("")
      setErrorMessage(null)
      setIsSuccess(false)
    }
  }, [isOpen])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!extractedToken) {
      setErrorMessage("Введите токен или ссылку на приглашение")
      return
    }

    try {
      await acceptInvite(extractedToken).unwrap()
      removeLocalPendingInvite(extractedToken)
      setIsSuccess(true)

      const targetSlug = invite?.workspace?.slug
      setTimeout(() => {
        onClose()
        if (targetSlug) {
          if (onSuccess) onSuccess(targetSlug)
          router.push(`/${targetSlug}`)
        } else {
          router.push("/")
        }
      }, 700)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      id="modal-join-invite"
      isOpen={isOpen}
      onClose={onClose}
      title="Вступление по приглашению"
      subtitle="Вставьте код приглашения или полную ссылку"
      tag="Инвайт"
      defaultWidth="max-w-lg"
      maximizedWidth="max-w-2xl"
    >
      <form onSubmit={handleAccept} className="p-6 sm:p-7 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="invite-input" className="text-xs sm:text-sm font-medium">
            Код или ссылка приглашения
          </Label>
          <div className="relative">
            <Input
              id="invite-input"
              type="text"
              required
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Вставьте токен или https://.../invites/TOKEN"
              disabled={isAccepting}
              className="h-10 text-xs sm:text-sm font-mono pr-8"
            />
            {isChecking && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Вы можете вставить как полный URL адрес приглашения, так и отдельный токен.
          </p>
        </div>

        {/* Live Preview Card */}
        {extractedToken && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 shadow-2xs">
            {isChecking ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Проверка информации о приглашении...</span>
              </div>
            ) : isInviteError || !invite ? (
              <div className="flex items-start gap-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  {getAuthErrorMessage(inviteError) ||
                    "Приглашение с таким токеном не найдено или истекло"}
                </span>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Рабочее пространство:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <FolderKanban className="size-3.5 text-muted-foreground" />
                    {invite.workspace?.name || "Воркспейс"} ({invite.workspace?.slug})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Назначенная роль:</span>
                  <span className="font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border text-[11px]">
                    {invite.role}
                  </span>
                </div>

                {invite.invited_by && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Пригласил(а):</span>
                    <span className="text-foreground">
                      {invite.invited_by.display_name} ({invite.invited_by.email})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            <span>Вы успешно присоединились к пространству!</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isAccepting || isChecking || !extractedToken || !invite}
            className="w-full h-10 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-2xs"
          >
            {isAccepting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Присоединение к пространству...</span>
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                <span>Принять и войти в пространство</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
