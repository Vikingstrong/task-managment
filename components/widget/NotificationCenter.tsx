"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/api/notificationApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { useAcceptInviteMutation } from "@/redux/api/inviteApi"
import {
  getPendingInvitesForEmail,
  removeLocalPendingInvite,
  subscribeToLocalInvites,
  type PendingInviteRecord,
} from "@/lib/invites"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { Notification } from "@/types/api"

interface NotificationCenterProps {
  workspaceSlug?: string | null
}

function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMin < 1) return "только что"
    if (diffMin < 60) return `${diffMin} мин.`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} ч.`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} дн.`
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
  } catch {
    return dateStr
  }
}

export function NotificationCenter({ workspaceSlug }: NotificationCenterProps) {
  const router = useRouter()
  const { data: currentUser } = useGetMeQuery()

  // 1. Fetch system notifications for active workspace (if any)
  const { data, isLoading } = useGetNotificationsQuery(
    { workspaceSlug: workspaceSlug! },
    { skip: !workspaceSlug }
  )

  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()
  const [markOneRead] = useMarkNotificationReadMutation()
  const [acceptInvite] = useAcceptInviteMutation()

  // 2. Local pending invites state
  const [pendingInvites, setPendingInvites] = React.useState<PendingInviteRecord[]>([])
  const [acceptingToken, setAcceptingToken] = React.useState<string | null>(null)

  const updatePendingInvites = React.useCallback(() => {
    if (currentUser?.email) {
      setPendingInvites(getPendingInvitesForEmail(currentUser.email))
    } else {
      setPendingInvites([])
    }
  }, [currentUser?.email])

  React.useEffect(() => {
    updatePendingInvites()
    const unsubscribe = subscribeToLocalInvites(() => {
      updatePendingInvites()
    })
    return unsubscribe
  }, [updatePendingInvites])

  const notifications = data?.data || []
  const workspaceUnreadCount = data?.unread_count || 0
  const totalUnreadCount = workspaceUnreadCount + pendingInvites.length

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!workspaceSlug || workspaceUnreadCount === 0) return
    try {
      await markAllRead({ workspaceSlug }).unwrap()
    } catch {
      // Handled
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!workspaceSlug || notif.is_read) return
    try {
      await markOneRead({
        workspaceSlug,
        notificationId: notif.id,
      }).unwrap()
    } catch {
      // Handled
    }
  }

  const handleAcceptInvite = async (token: string, targetSlug: string) => {
    setAcceptingToken(token)
    try {
      await acceptInvite(token).unwrap()
      removeLocalPendingInvite(token)
      setPendingInvites((prev) => prev.filter((i) => i.token !== token))
      router.push(`/${targetSlug}`)
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    } finally {
      setAcceptingToken(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        title="Уведомления"
      >
        <Bell className="size-4" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[9px] font-bold text-background shadow-xs">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-2 shadow-md">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
            Уведомления {totalUnreadCount > 0 && `(${totalUnreadCount})`}
          </DropdownMenuLabel>
          {workspaceUnreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3" />
              <span>Прочитать все</span>
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* 1. Pending Workspace Invites Section (Always visible across all pages) */}
        {pendingInvites.length > 0 && (
          <div className="p-2.5 rounded-lg border border-border/80 bg-muted/30 space-y-2 mb-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-foreground" />
                Приглашения в пространства ({pendingInvites.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.token}
                  className="rounded-md border border-border bg-card p-2 text-xs space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-foreground truncate">
                        {inv.workspaceName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        /{inv.workspaceSlug} · роль: {inv.role}
                      </p>
                    </div>
                    <Link
                      href={`/invites/${inv.token}`}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                      title="Открыть страницу приглашения"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      disabled={acceptingToken === inv.token}
                      onClick={() => handleAcceptInvite(inv.token, inv.workspaceSlug)}
                      className="h-6 px-2.5 text-[11px] font-medium bg-foreground text-background hover:bg-foreground/90 gap-1 cursor-pointer"
                    >
                      {acceptingToken === inv.token ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Check className="size-3" />
                      )}
                      <span>Принять</span>
                    </Button>
                    <Link
                      href={`/invites/${inv.token}`}
                      className="inline-flex items-center h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground font-medium rounded hover:bg-muted/40 transition-colors"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Workspace Notification Stream */}
        <div className="max-h-72 overflow-y-auto space-y-0.5">
          {!workspaceSlug ? (
            pendingInvites.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Выберите рабочее пространство для просмотра системных уведомлений
              </div>
            ) : null
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            pendingInvites.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Нет уведомлений</p>
                <p className="text-[11px]">Здесь будут появляться назначения и комментарии</p>
              </div>
            )
          ) : (
            notifications.map((n) => {
              const isUnread = !n.is_read
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-2.5 p-2 rounded-md transition-colors cursor-pointer text-xs ${
                    isUnread
                      ? "bg-muted/40 hover:bg-muted/60"
                      : "hover:bg-muted/20 opacity-80"
                  }`}
                >
                  <Avatar className="size-6 border border-border mt-0.5 shrink-0">
                    {n.actor?.avatar_url && (
                      <AvatarImage src={n.actor.avatar_url} alt={n.actor.display_name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {(n.actor?.display_name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs text-foreground leading-snug">
                      <span className="font-semibold">{n.actor?.display_name || "Пользователь"} </span>
                      {n.type === "issue_assigned" && "назначил вам задачу"}
                      {n.type === "comment_added" && "оставил комментарий к задаче"}
                      {n.type === "mentioned" && "упомянул вас"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {formatNotificationTime(n.created_at)}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="size-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
