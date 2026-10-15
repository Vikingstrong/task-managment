"use client"

import * as React from "react"
import { Bell, CheckCheck, Loader2, MessageSquare, UserCheck } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  // If no workspaceSlug is provided, do not attempt to query
  const { data, isLoading } = useGetNotificationsQuery(
    { workspaceSlug: workspaceSlug! },
    { skip: !workspaceSlug }
  )

  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()
  const [markOneRead] = useMarkNotificationReadMutation()

  const notifications = data?.data || []
  const unreadCount = data?.unread_count || 0

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!workspaceSlug || unreadCount === 0) return
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        title="Уведомления"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[9px] font-bold text-background shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-1.5 shadow-md">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
            Уведомления {unreadCount > 0 && `(${unreadCount})`}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
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

        <DropdownMenuSeparator className="my-1" />

        <div className="max-h-80 overflow-y-auto space-y-0.5">
          {!workspaceSlug ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Выберите рабочее пространство для просмотра уведомлений
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Нет уведомлений</p>
              <p className="text-[11px]">Здесь будут появляться назначения и комментарии</p>
            </div>
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
