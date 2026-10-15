import * as React from "react"
import {
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  XCircle,
} from "lucide-react"
import type { IssuePriority, StateGroup } from "@/types/api"

export const DEFAULT_WORKFLOW_STATES: Array<{
  name: string
  color: string
  group: StateGroup
  order: number
  is_default?: boolean
}> = [
  { name: "Бэклог", color: "#737373", group: "backlog", order: 0 },
  { name: "К выполнению", color: "#3b82f6", group: "unstarted", order: 1, is_default: true },
  { name: "В работе", color: "#eab308", group: "started", order: 2 },
  { name: "Готово", color: "#22c55e", group: "completed", order: 3 },
  { name: "Отменено", color: "#ef4444", group: "cancelled", order: 4 },
]

export const PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; colorClass: string }
> = {
  urgent: { label: "Срочный", colorClass: "text-red-500 bg-red-500/10 border-red-500/20" },
  high: { label: "Высокий", colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  medium: { label: "Средний", colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Низкий", colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  none: { label: "Без приоритета", colorClass: "text-muted-foreground bg-muted/40 border-border" },
}

export function getStateGroupIcon(group: StateGroup) {
  switch (group) {
    case "backlog":
      return <Circle className="size-3 text-muted-foreground" />
    case "unstarted":
      return <Circle className="size-3 text-blue-500" />
    case "started":
      return <Clock className="size-3 text-amber-500" />
    case "completed":
      return <CheckCircle2 className="size-3 text-emerald-500" />
    case "cancelled":
      return <XCircle className="size-3 text-destructive" />
    default:
      return <HelpCircle className="size-3 text-muted-foreground" />
  }
}
