"use client"

import * as React from "react"
import { Trash2, User as UserIcon } from "lucide-react"

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

export interface TaskListRowProps {
  issue: Issue
  projectIdentifier: string
  currentState: ProjectState
  allStates: ProjectState[]
  availableMembers?: ResolvedMember[]
  onSelect: (issue: Issue) => void
  onMoveState: (issueId: string, targetStateId: string) => void
  onDelete: (issueId: string, title: string) => void
}

export function TaskListRow({
  issue,
  projectIdentifier,
  currentState,
  allStates,
  availableMembers = [],
  onSelect,
  onMoveState,
  onDelete,
}: TaskListRowProps) {
  const priorityInfo = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.none
  const assigneeDisplay = resolveAssigneeDisplay(issue, availableMembers)

  return (
    <div
      onClick={() => onSelect(issue)}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border/70 bg-card/50 hover:bg-card hover:border-foreground/30 hover:shadow-xs transition-all cursor-pointer select-none"
    >
      {/* Left side: Identifier, Status dropdown, Title, Description snippet */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
          {projectIdentifier}-{issue.sequence_id}
        </span>

        {/* State indicator dropdown */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-border/60 bg-muted/30 hover:bg-muted/70 transition-colors cursor-pointer outline-hidden">
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: currentState.color }}
              />
              <span className="hidden md:inline text-[11px] text-foreground font-medium">
                {currentState.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 p-1.5">
              {allStates.map((targetState) => {
                const isSelected = targetState.id === currentState.id
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
                      if (!isSelected) {
                        onMoveState(issue.id, targetState.id)
                      }
                    }}
                    className="cursor-pointer text-xs flex items-center justify-between rounded-md py-1.5 px-2"
                  >
                    <div className="flex items-center gap-2">
                      {getStateGroupIcon(targetState.group)}
                      <span className={isSelected ? "font-semibold text-foreground" : ""}>
                        {targetState.name}
                      </span>
                    </div>
                    <span className={cn("size-2 rounded-full", dotColor)} />
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Preview */}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-foreground truncate">
            {issue.title}
          </p>
          {issue.description && (
            <p className="text-[11px] text-muted-foreground truncate hidden lg:block">
              {issue.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Priority, Assignee, Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-end sm:self-center">
        {/* Priority Badge */}
        <span
          className={cn(
            "text-[10px] font-medium border px-2 py-0.5 rounded-sm shrink-0",
            priorityInfo.colorClass
          )}
        >
          {priorityInfo.label}
        </span>

        {/* Assignee */}
        <div className="w-28 flex items-center justify-start">
          {assigneeDisplay ? (
            <div
              className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-foreground max-w-full"
              title={`Исполнитель: ${assigneeDisplay.name}`}
            >
              <div className="size-3.5 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[8px] font-bold uppercase shrink-0">
                {assigneeDisplay.initial}
              </div>
              <span className="text-[10px] font-medium truncate">
                {assigneeDisplay.name}
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
              <UserIcon className="size-3" />
              <span>—</span>
            </span>
          )}
        </div>

        {/* Delete action */}
        <button
          type="button"
          title="Удалить задачу"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(issue.id, issue.title)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-[#ff5f56] rounded transition-opacity cursor-pointer shrink-0"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
