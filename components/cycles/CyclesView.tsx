"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  ListTodo,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectNavTabs } from "@/components/projects/ProjectNavTabs"
import { CreateCycleModal } from "./CreateCycleModal"
import { EditCycleModal } from "./EditCycleModal"
import { CycleIssuesModal } from "./CycleIssuesModal"
import { DeleteCycleModal } from "./DeleteCycleModal"
import { useGetProjectQuery, useGetProjectMembersQuery } from "@/redux/api/projectApi"
import { useGetCyclesQuery, useDeleteCycleMutation } from "@/redux/api/cycleApi"
import { useGetIssuesQuery } from "@/redux/api/issueApi"
import { useGetStatesQuery } from "@/redux/api/stateApi"
import { cn } from "@/lib/utils"
import type { Cycle, CycleStatus, ProjectState } from "@/types/api"

interface CyclesViewProps {
  workspaceSlug: string
  projectId: string
}

function formatCycleDate(dateStr?: string | null): string {
  if (!dateStr) return "Бессрочно"
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default function CyclesView({ workspaceSlug, projectId }: CyclesViewProps) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | CycleStatus>("all")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCycle, setEditingCycle] = React.useState<Cycle | null>(null)
  const [managingIssuesCycle, setManagingIssuesCycle] = React.useState<Cycle | null>(null)
  const [deletingCycle, setDeletingCycle] = React.useState<Cycle | null>(null)

  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery({
    workspaceSlug,
    projectId,
  })

  const { data: members = [] } = useGetProjectMembersQuery({
    workspaceSlug,
    projectId,
  })

  const { data: cycles = [], isLoading: isLoadingCycles } = useGetCyclesQuery({
    workspaceSlug,
    projectId,
  })

  const { data: states = [] } = useGetStatesQuery({
    workspaceSlug,
    projectId,
  })

  const [deleteCycle, { isLoading: isDeletingCycle }] = useDeleteCycleMutation()

  const filteredCycles = React.useMemo(() => {
    if (statusFilter === "all") return cycles
    return cycles.filter((c) => c.status === statusFilter)
  }, [cycles, statusFilter])

  const handleDelete = (cycle: Cycle) => {
    setDeletingCycle(cycle)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCycle) return
    try {
      await deleteCycle({
        workspaceSlug,
        projectId,
        cycleId: deletingCycle.id,
      }).unwrap()
      setDeletingCycle(null)
    } catch {
      // Handled
    }
  }

  if (isProjectLoading || !project) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1536px] 2xl:max-w-[1600px] space-y-5">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <Link
              href={`/${workspaceSlug}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Назад к проектам пространства</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md border border-border bg-muted/50 text-foreground tracking-wide">
                {project.identifier}
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {project.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono text-muted-foreground">
              <Users className="size-3.5" />
              <span>{members.length} участников</span>
            </span>
          </div>
        </div>

        {/* Project Container */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <ProjectNavTabs workspaceSlug={workspaceSlug} projectId={projectId} />

          {/* Sub Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/10 px-4 sm:px-6 py-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto">
              {(["all", "active", "upcoming", "completed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer capitalize whitespace-nowrap",
                    statusFilter === st
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {st === "all"
                    ? "Все спринты"
                    : st === "active"
                      ? "Активные"
                      : st === "upcoming"
                        ? "Предстоящие"
                        : "Завершенные"}
                </button>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Новый спринт</span>
            </Button>
          </div>

          {/* Cycles Content */}
          <div className="p-4 sm:p-6 bg-background/20 min-h-[450px]">
            {isLoadingCycles ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCycles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-dashed border-border/70 rounded-lg">
                <RotateCw className="size-6 text-muted-foreground/60" />
                <h3 className="text-sm font-medium text-foreground">Спринты не найдены</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Используйте спринты для планирования итераций и отслеживания прогресса команды.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                    className="h-8 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
                  >
                    Создать первый спринт
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCycles.map((cycle) => (
                  <CycleCard
                    key={cycle.id}
                    cycle={cycle}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    states={states}
                    onEdit={setEditingCycle}
                    onDelete={handleDelete}
                    onManageIssues={setManagingIssuesCycle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCycleModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditCycleModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        cycle={editingCycle}
        isOpen={!!editingCycle}
        onClose={() => setEditingCycle(null)}
      />

      <CycleIssuesModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projectIdentifier={project.identifier}
        cycle={managingIssuesCycle}
        isOpen={!!managingIssuesCycle}
        onClose={() => setManagingIssuesCycle(null)}
      />

      <DeleteCycleModal
        isOpen={!!deletingCycle}
        onClose={() => setDeletingCycle(null)}
        onConfirm={handleConfirmDelete}
        cycleName={deletingCycle?.name || ""}
        isLoading={isDeletingCycle}
      />
    </div>
  )
}

interface CycleCardProps {
  cycle: Cycle
  workspaceSlug: string
  projectId: string
  states: ProjectState[]
  onEdit: (cycle: Cycle) => void
  onDelete: (cycle: Cycle) => void
  onManageIssues: (cycle: Cycle) => void
}

function CycleCard({
  cycle,
  workspaceSlug,
  projectId,
  states,
  onEdit,
  onDelete,
  onManageIssues,
}: CycleCardProps) {
  // Live query of issues associated with this sprint/cycle
  const { data: cycleIssues = [] } = useGetIssuesQuery({
    workspaceSlug,
    projectId,
    cycle: cycle.id,
  })

  // Dynamic progress calculation from actual bound tasks and their state groups
  const total = cycleIssues.length
  const completed = React.useMemo(() => {
    return cycleIssues.filter((issue) => {
      const st = states.find((s) => s.id === issue.state_id)
      return st?.group === "completed" || !!issue.completed_at
    }).length
  }, [cycleIssues, states])

  const active = React.useMemo(() => {
    return cycleIssues.filter((issue) => {
      const st = states.find((s) => s.id === issue.state_id)
      return st ? st.group === "started" || st.group === "unstarted" || st.group === "backlog" : true
    }).length
  }, [cycleIssues, states])

  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="group rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        {/* Status & Actions Header */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-md border",
              cycle.status === "active"
                ? "border-foreground/40 bg-foreground/5 text-foreground font-semibold"
                : cycle.status === "completed"
                  ? "border-border bg-muted/30 text-muted-foreground"
                  : "border-border bg-muted/20 text-muted-foreground"
            )}
          >
            {cycle.status === "active"
              ? "Активный"
              : cycle.status === "completed"
                ? "Завершен"
                : "Предстоящий"}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(cycle)}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Редактировать"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(cycle)}
              className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"
              title="Удалить"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Name & Description */}
        <div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {cycle.name}
          </h3>
          {cycle.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {cycle.description}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Calendar className="size-3" />
          <span>
            {formatCycleDate(cycle.start_date)} — {formatCycleDate(cycle.end_date)}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground text-[11px]">
            {active > 0 ? `${active} активных` : "Прогресс"}
          </span>
          <span className="font-mono font-medium text-foreground text-[11px]">
            {progressPct}% ({completed}/{total})
          </span>
        </div>

        {/* Minimalist Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Manage Issues Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onManageIssues(cycle)}
            className="w-full h-8 text-xs font-medium gap-1.5 cursor-pointer"
          >
            <ListTodo className="size-3.5 text-muted-foreground" />
            <span>Задачи спринта ({total})</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
