"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  FolderKanban,
  Loader2,
  LogIn,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetInviteQuery, useAcceptInviteMutation } from "@/redux/api/inviteApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { WorkspaceRole } from "@/types/api"

interface InviteClientProps {
  token: string
}

function roleLabel(role: WorkspaceRole | string): string {
  switch (role) {
    case "owner":
      return "Владелец"
    case "admin":
      return "Администратор"
    case "guest":
      return "Гость"
    case "member":
    default:
      return "Участник"
  }
}

function formatExpiryDate(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return dateStr
  }
}

export default function InviteClient({ token }: InviteClientProps) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    data: invite,
    isLoading: isInviteLoading,
    isError: isInviteError,
    error: inviteFetchError,
  } = useGetInviteQuery(token)

  const { data: currentUser, isLoading: isUserLoading } = useGetMeQuery()
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation()

  const handleAccept = async () => {
    setErrorMessage(null)
    try {
      await acceptInvite(token).unwrap()
      setIsSuccess(true)
      const targetSlug = invite?.workspace?.slug
      setTimeout(() => {
        if (targetSlug) {
          router.push(`/${targetSlug}`)
        } else {
          router.push("/")
        }
      }, 900)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  // 1. Loading State
  if (isInviteLoading || isUserLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-foreground" />
          <p className="text-xs font-mono">Проверка приглашения...</p>
        </div>
      </div>
    )
  }

  // 2. Error / Not Found / Expired State
  if (isInviteError || !invite) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-destructive/20 bg-card p-6 sm:p-7 shadow-xs space-y-4 text-center">
          <div className="size-10 rounded-full border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-foreground">
              Приглашение недействительно
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {getAuthErrorMessage(inviteFetchError) ||
                "Ссылка на приглашение устарела, была отозвана или не существует."}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              На главную
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/90 transition-colors"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const workspaceName = invite.workspace?.name || "Рабочее пространство"
  const workspaceSlug = invite.workspace?.slug || ""
  const inviterName = invite.invited_by?.display_name || "Администратор"
  const inviterEmail = invite.invited_by?.email || ""
  const targetEmail = invite.email
  const roleName = roleLabel(invite.role)
  const isAuth = !!currentUser

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* macOS Style Window Frame */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* macOS Title Bar */}
          <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5 select-none">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff5f56]/80 border border-black/10 inline-block" />
              <span className="size-3 rounded-full bg-[#ffbd2e]/80 border border-black/10 inline-block" />
              <span className="size-3 rounded-full bg-[#27c93f]/80 border border-black/10 inline-block" />
            </div>
            <span className="text-[11px] font-mono font-medium text-muted-foreground truncate max-w-[200px]">
              Приглашение в команду
            </span>
            <div className="size-3" />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-lg border border-border bg-muted/60 text-foreground flex items-center justify-center font-mono text-base font-bold uppercase select-none shrink-0">
                {workspaceName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                  {workspaceName}
                </h1>
                {workspaceSlug && (
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    /{workspaceSlug}
                  </p>
                )}
              </div>
            </div>

            {/* Invite Details Card */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Роль в пространстве:</span>
                <span className="font-medium text-foreground font-mono px-2 py-0.5 rounded bg-muted/50 border border-border">
                  {roleName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Пригласил(а):</span>
                <span className="font-medium text-foreground text-right truncate max-w-[180px]">
                  {inviterName} {inviterEmail && `(${inviterEmail})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Приглашение для:</span>
                <span className="font-mono text-foreground">{targetEmail}</span>
              </div>
              {invite.expires_at && (
                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    Действительно до:
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatExpiryDate(invite.expires_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Feedback */}
            {isSuccess && (
              <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="size-4" />
                <span>Приглашение принято! Переход в рабочее пространство...</span>
              </div>
            )}

            {/* Actions: Authenticated vs Unauthenticated */}
            {!isSuccess && (
              <div className="space-y-3 pt-1">
                {isAuth ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border border-border/50">
                      <span className="text-[11px]">Текущий аккаунт:</span>
                      <span className="font-medium text-foreground truncate">
                        {currentUser.display_name} ({currentUser.email})
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="w-full h-9 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Принятие приглашения...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          <span>Принять приглашение</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-muted-foreground text-center">
                      Для принятия приглашения войдите в аккаунт или создайте новый
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/login?redirect=/invites/${token}`}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
                      >
                        <LogIn className="size-3.5" />
                        <span>Войти</span>
                      </Link>
                      <Link
                        href={`/register?invite_token=${token}`}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors shadow-2xs"
                      >
                        <UserPlus className="size-3.5" />
                        <span>Регистрация</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
