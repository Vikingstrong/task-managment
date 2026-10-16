"use client"

import * as React from "react"
import {
  ArrowRight,
  Clock,
  History,
  Loader2,
  User as UserIcon,
} from "lucide-react"

import { useGetIssueActivityQuery } from "@/redux/api/activityApi"
import type { ActivityItem } from "@/types/api"

export interface IssueActivityProps {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export function IssueActivity({
  workspaceSlug,
  projectId,
  issueId,
}: IssueActivityProps) {
  const { data, isLoading, isError } = useGetIssueActivityQuery({
    workspaceSlug,
    projectId,
    issueId,
  })

  const activities: ActivityItem[] = data?.data || []

  const formatActionText = (item: ActivityItem): { title: string; detail?: string } => {
    const action = item.action?.toLowerCase() || ""
    const field = item.field?.toLowerCase() || ""

    if (action === "created") {
      return { title: "Создал(а) задачу" }
    }
    if (action === "comment_added") {
      return { title: "Оставил(а) комментарий" }
    }
    if (action === "attachment_added") {
      return { title: "Прикрепил(а) файл к задаче", detail: item.new_value || undefined }
    }
    if (action === "relation_added") {
      return { title: "Добавил(а) связь с другой задачей" }
    }
    if (action === "relation_removed") {
      return { title: "Удалил(а) связь с задачей" }
    }

    if (field === "state_id") {
      return { title: "Изменил(а) статус воркфлоу" }
    }
    if (field === "priority") {
      return { title: "Изменил(а) приоритет" }
    }
    if (field === "title") {
      return { title: "Изменил(а) заголовок задачи" }
    }
    if (field === "description") {
      return { title: "Обновил(а) описание задачи" }
    }
    if (field === "assignee" || action === "assigned") {
      return { title: "Назначил(а) исполнителя" }
    }
    if (action === "unassigned") {
      return { title: "Снял(а) исполнителя с задачи" }
    }
    if (field === "start_date") {
      return { title: "Изменил(а) дату начала" }
    }
    if (field === "due_date") {
      return { title: "Установил(а) срок выполнения" }
    }
    if (field === "estimate_points") {
      return { title: "Изменил(а) оценку сложности (story points)" }
    }
    if (field === "parent_id") {
      return { title: "Изменил(а) родительскую задачу" }
    }

    return {
      title: item.action || "Обновление задачи",
      detail: item.field ? `Поле: ${item.field}` : undefined,
    }
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <History className="size-3.5 text-muted-foreground" />
          <span>История изменений ({activities.length})</span>
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>Загрузка журнала действий...</span>
        </div>
      ) : isError ? (
        <div className="text-center p-6 text-xs text-destructive">
          Не удалось загрузить историю изменений задачи
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center p-8 rounded-lg border border-border/50 bg-muted/10 text-xs text-muted-foreground space-y-1">
          <Clock className="size-5 mx-auto text-muted-foreground/60 mb-2" />
          <p className="font-medium text-foreground">История пока пуста</p>
          <p className="text-[11px]">Здесь будут фиксироваться все изменения по задаче</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border/80">
          {activities.map((item) => {
            const { title, detail } = formatActionText(item)
            const actorName = item.actor?.display_name || "Участник"
            const actorInitial = actorName.charAt(0).toUpperCase()
            const hasDiff = item.old_value || item.new_value

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Dot */}
                <div className="absolute -left-6 top-1 size-5 rounded-full bg-card border border-border flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-foreground" />
                </div>

                <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5 hover:border-foreground/30 transition-colors">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {item.actor?.avatar_url ? (
                        <img
                          src={item.actor.avatar_url}
                          alt={actorName}
                          className="size-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                          {actorInitial}
                        </div>
                      )}
                      <span className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                        {actorName}
                      </span>
                      <span className="text-muted-foreground text-[11px] truncate">
                        {title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  {detail && (
                    <div className="text-[11px] text-muted-foreground">
                      {detail}
                    </div>
                  )}

                  {/* Value Diff (Old -> New) */}
                  {hasDiff && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono flex-wrap">
                      {item.old_value && (
                        <span className="line-through text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 max-w-[180px] truncate">
                          {item.old_value}
                        </span>
                      )}
                      {item.old_value && item.new_value && (
                        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                      )}
                      {item.new_value && (
                        <span className="font-medium text-foreground bg-foreground/5 px-1.5 py-0.5 rounded border border-foreground/20 max-w-[180px] truncate">
                          {item.new_value}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
