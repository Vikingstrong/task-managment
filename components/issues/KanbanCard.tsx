"use client"

import * as React from "react"
import { ArrowRight, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRIORITY_CONFIG, getStateGroupIcon } from "./kanbanConstants"
import { resolveAssigneeDisplay, type ResolvedMember } from "./assigneeUtils"
import { cn } from "@/lib/utils"
import type { Issue, ProjectState } from "@/types/api"

export interface KanbanCardProps {
  issue: Issue
  projectIdentifier: string
  currentState: ProjectState
  allStates: ProjectState[]
  availableMembers?: ResolvedMember[]
  isDragging?: boolean
  onSelect: (issue: Issue) => void
  onMoveState: (issueId: string, targetStateId: string) => void
  onDelete: (issueId: string, title: string) => void
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
}

export function KanbanCard({
  issue,
  projectIdentifier,
  currentState,
  allStates,
  availableMembers = [],
  isDragging = false,
  onSelect,
  onMoveState,
  onDelete,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const priorityInfo = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.none
  const assigneeDisplay = resolveAssigneeDisplay(issue, availableMembers)

  const isDraggingRef = React.useRef(false)
  const dragTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ issueId: issue.id, fromStateId: currentState.id })
    )
    onDragStart?.(issue.id)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false
    }, 150)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only open details if user wasn't dragging
    if (isDraggingRef.current) return
    onSelect(issue)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-foreground/40 hover:shadow-sm transition-all select-none space-y-2 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 scale-95 border-dashed border-foreground/60 shadow-none"
      )}
    >
      {/* Top Row: Identifier, Priority Badge, Quick Delete Button */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {projectIdentifier}-{issue.sequence_id}
        </span>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-[10px] font-medium border px-1.5 py-0.2 rounded-sm",
              priorityInfo.colorClass
            )}
          >
            {priorityInfo.label}
          </span>

          <button
            type="button"
            title="Удалить задачу"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(issue.id, issue.title)
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-[#ff5f56] rounded transition-opacity cursor-pointer shrink-0"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
        {issue.title}
      </p>

      {/* Description preview if present */}
      {issue.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {issue.description}
        </p>
      )}

      {/* Attached Labels Badges */}
      {Array.isArray(issue.labels) && issue.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {issue.labels.map((l: any) => {
            const labelObj = l.label || l
            if (!labelObj?.name) return null
            return (
              <span
                key={labelObj.id || labelObj.name}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono border border-border/60 bg-muted/40 text-foreground"
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: labelObj.color || "#888" }}
                />
                <span className="truncate max-w-[90px]">{labelObj.name}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Bottom Row: State Dropdown & Assignee (Guest Landing Style) */}
      <div
        className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px] text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* State Badge with Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer outline-hidden border border-border/40 max-w-[120px]">
            <div
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: currentState.color }}
            />
            <span className="truncate">{currentState.name}</span>
            <ArrowRight className="size-2 text-muted-foreground shrink-0 ml-0.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-1.5">
            {allStates
              .filter((s) => s.id !== currentState.id)
              .map((targetState) => {
                const dotColor =
                  targetState.group === "completed"
                    ? "bg-[#27c93f]"
                    : targetState.group === "cancelled"
                      ? "bg-[#ff5f56]"
                      : targetState.group === "started"
                        ? "bg-[#ffbd2e]"
                        : targetState.group === "unstarted"
                          ? "bg-[#007aff]"
                          : "bg-[#8e8e93]"

                return (
                  <DropdownMenuItem
                    key={targetState.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveState(issue.id, targetState.id)
                    }}
                    className="cursor-pointer text-xs flex items-center justify-between rounded-md py-1.5 px-2"
                  >
                    <div className="flex items-center gap-2">
                      {getStateGroupIcon(targetState.group)}
                      <span>{targetState.name}</span>
                    </div>
                    <span
                      className={cn("size-2 rounded-full", dotColor)}
                      title={targetState.name}
                    />
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assignee Avatar & Name */}
        {assigneeDisplay ? (
          <div
            className="flex items-center gap-1.5 min-w-0"
            title={`Исполнитель: ${assigneeDisplay.name}`}
          >
            <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold uppercase shrink-0">
              {assigneeDisplay.initial}
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
              {assigneeDisplay.name}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            Не назначен
          </span>
        )}
      </div>
    </div>
  )
}
