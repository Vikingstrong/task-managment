"use client"

import * as React from "react"
import {
  Calendar,
  Check,
  ChevronDown,
  Filter,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Subtitles,
  Tag,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { PRIORITY_CONFIG } from "./kanbanConstants"
import type { ResolvedMember } from "./assigneeUtils"
import type { IssuePriority, ProjectLabel } from "@/types/api"
import { cn } from "@/lib/utils"

export type GroupByOption = "state" | "priority" | "assignee"

export interface KanbanFiltersState {
  priorities: IssuePriority[]
  assigneeIds: string[]
  labelIds: string[]
  dateFilter: "all" | "has_due" | "overdue" | "this_week"
  subtaskFilter: "all" | "roots" | "subtasks"
}

export interface KanbanFilterBarProps {
  filters: KanbanFiltersState
  onFiltersChange: (next: KanbanFiltersState) => void
  groupBy: GroupByOption
  onGroupByChange: (next: GroupByOption) => void
  labels: ProjectLabel[]
  members: ResolvedMember[]
  onOpenWorkflowModal: () => void
}

const PRIORITIES_LIST: IssuePriority[] = ["urgent", "high", "medium", "low", "none"]

const DATE_OPTIONS: { id: "all" | "has_due" | "overdue" | "this_week"; label: string }[] = [
  { id: "all", label: "Все сроки" },
  { id: "has_due", label: "С дедлайном" },
  { id: "overdue", label: "Просроченные" },
  { id: "this_week", label: "На этой неделе" },
]

const SUBTASK_OPTIONS: { id: "all" | "roots" | "subtasks"; label: string }[] = [
  { id: "all", label: "Все типы" },
  { id: "roots", label: "Только основные" },
  { id: "subtasks", label: "Только подзадачи" },
]

export function KanbanFilterBar({
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
  labels,
  members,
  onOpenWorkflowModal,
}: KanbanFilterBarProps) {
  const activeCount =
    filters.priorities.length +
    filters.assigneeIds.length +
    filters.labelIds.length +
    (filters.dateFilter !== "all" ? 1 : 0) +
    (filters.subtaskFilter !== "all" ? 1 : 0)

  const togglePriority = (p: IssuePriority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((item) => item !== p)
      : [...filters.priorities, p]
    onFiltersChange({ ...filters, priorities: next })
  }

  const toggleAssignee = (uid: string) => {
    const next = filters.assigneeIds.includes(uid)
      ? filters.assigneeIds.filter((item) => item !== uid)
      : [...filters.assigneeIds, uid]
    onFiltersChange({ ...filters, assigneeIds: next })
  }

  const toggleLabel = (lid: string) => {
    const next = filters.labelIds.includes(lid)
      ? filters.labelIds.filter((item) => item !== lid)
      : [...filters.labelIds, lid]
    onFiltersChange({ ...filters, labelIds: next })
  }

  const setDateFilter = (df: "all" | "has_due" | "overdue" | "this_week") => {
    onFiltersChange({ ...filters, dateFilter: df })
  }

  const setSubtaskFilter = (sf: "all" | "roots" | "subtasks") => {
    onFiltersChange({ ...filters, subtaskFilter: sf })
  }

  const handleReset = () => {
    onFiltersChange({
      priorities: [],
      assigneeIds: [],
      labelIds: [],
      dateFilter: "all",
      subtaskFilter: "all",
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-card/60 p-2.5 sm:px-3 text-xs select-none">
      {/* Left side: Filter Popovers */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium mr-0.5">
          <Filter className="size-3" />
          <span className="hidden sm:inline">Фильтры:</span>
        </span>

        {/* 1. Priority Multi-Select */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer outline-hidden",
              filters.priorities.length > 0
                ? "border-foreground bg-muted text-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Zap className="size-3 text-muted-foreground" />
            <span>
              {filters.priorities.length === 0
                ? "Приоритет"
                : `Приоритет (${filters.priorities.length})`}
            </span>
            <ChevronDown className="size-2.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-1">
            <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
              Фильтр по приоритету
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITIES_LIST.map((p) => {
              const cfg = PRIORITY_CONFIG[p]
              const isChecked = filters.priorities.includes(p)
              return (
                <DropdownMenuItem
                  key={p}
                  onClick={(e) => {
                    e.preventDefault()
                    togglePriority(p)
                  }}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        p === "urgent"
                          ? "bg-[#ff5f56]"
                          : p === "high"
                            ? "bg-[#ff9500]"
                            : p === "medium"
                              ? "bg-[#ffbd2e]"
                              : p === "low"
                                ? "bg-[#007aff]"
                                : "bg-[#8e8e93]"
                      )}
                    />
                    <span>{cfg?.label || p}</span>
                  </div>
                  {isChecked && <Check className="size-3.5 text-foreground shrink-0" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Assignee Multi-Select */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer outline-hidden",
              filters.assigneeIds.length > 0
                ? "border-foreground bg-muted text-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <UserIcon className="size-3 text-muted-foreground" />
            <span>
              {filters.assigneeIds.length === 0
                ? "Исполнитель"
                : `Исполнитель (${filters.assigneeIds.length})`}
            </span>
            <ChevronDown className="size-2.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 p-1 max-h-60 overflow-y-auto">
            <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
              Фильтр по исполнителям
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                toggleAssignee("unassigned")
              }}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                <span className="italic text-muted-foreground">Не назначен</span>
              </div>
              {filters.assigneeIds.includes("unassigned") && (
                <Check className="size-3.5 text-foreground shrink-0" />
              )}
            </DropdownMenuItem>
            {members.map((m) => {
              const uid = m.user_id
              const name = m.display_name || m.email || "Участник"
              const isChecked = filters.assigneeIds.includes(uid)
              return (
                <DropdownMenuItem
                  key={uid}
                  onClick={(e) => {
                    e.preventDefault()
                    toggleAssignee(uid)
                  }}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                  {isChecked && <Check className="size-3.5 text-foreground shrink-0" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Labels Multi-Select */}
        {labels.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer outline-hidden",
                filters.labelIds.length > 0
                  ? "border-foreground bg-muted text-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Tag className="size-3 text-muted-foreground" />
              <span>
                {filters.labelIds.length === 0 ? "Метки" : `Метки (${filters.labelIds.length})`}
              </span>
              <ChevronDown className="size-2.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 p-1 max-h-60 overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
                Фильтр по меткам
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {labels.map((lbl) => {
                const isChecked = filters.labelIds.includes(lbl.id)
                return (
                  <DropdownMenuItem
                    key={lbl.id}
                    onClick={(e) => {
                      e.preventDefault()
                      toggleLabel(lbl.id)
                    }}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span className="truncate">{lbl.name}</span>
                    </div>
                    {isChecked && <Check className="size-3.5 text-foreground shrink-0" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 4. Date Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer outline-hidden",
              filters.dateFilter !== "all"
                ? "border-foreground bg-muted text-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Calendar className="size-3 text-muted-foreground" />
            <span>
              {DATE_OPTIONS.find((o) => o.id === filters.dateFilter)?.label || "Сроки"}
            </span>
            <ChevronDown className="size-2.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 p-1">
            <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
              Срок выполнения
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DATE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
              >
                <span>{opt.label}</span>
                {filters.dateFilter === opt.id && (
                  <Check className="size-3.5 text-foreground shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Subtask Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer outline-hidden",
              filters.subtaskFilter !== "all"
                ? "border-foreground bg-muted text-foreground font-semibold"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Subtitles className="size-3 text-muted-foreground" />
            <span>
              {SUBTASK_OPTIONS.find((o) => o.id === filters.subtaskFilter)?.label || "Иерархия"}
            </span>
            <ChevronDown className="size-2.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 p-1">
            <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
              Уровень задач
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SUBTASK_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => setSubtaskFilter(opt.id)}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded cursor-pointer"
              >
                <span>{opt.label}</span>
                {filters.subtaskFilter === opt.id && (
                  <Check className="size-3.5 text-foreground shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Button */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-1"
            title="Сбросить все фильтры"
          >
            <RotateCcw className="size-3" />
            <span className="text-[11px]">Сбросить ({activeCount})</span>
          </button>
        )}
      </div>

      {/* Right side: Group By Switcher & Workflow Settings */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Group By Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hidden xl:inline text-[11px] font-medium">Группировка:</span>
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onGroupByChange("state")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors cursor-pointer",
                groupBy === "state"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Статус
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange("priority")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors cursor-pointer",
                groupBy === "priority"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Приоритет
            </button>
            <button
              type="button"
              onClick={() => onGroupByChange("assignee")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors cursor-pointer",
                groupBy === "assignee"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Исполнитель
            </button>
          </div>
        </div>

        {/* Workflow Columns Modal Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenWorkflowModal}
          className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer shrink-0"
          title="Настройка колонок и воркфлоу"
        >
          <SlidersHorizontal className="size-3 text-muted-foreground" />
          <span className="hidden sm:inline text-[11px]">Воркфлоу</span>
        </Button>
      </div>
    </div>
  )
}
