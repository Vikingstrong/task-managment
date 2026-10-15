"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Boxes,
  Calendar,
  CheckCircle2,
  Edit2,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectNavTabs } from "@/components/projects/ProjectNavTabs"
import { CreateModuleModal } from "./CreateModuleModal"
import { EditModuleModal } from "./EditModuleModal"
import { ModuleIssuesModal } from "./ModuleIssuesModal"
import { DeleteModuleModal } from "./DeleteModuleModal"
import { useGetProjectQuery, useGetProjectMembersQuery } from "@/redux/api/projectApi"
import { useGetModulesQuery, useDeleteModuleMutation } from "@/redux/api/moduleApi"
import { useGetIssuesQuery } from "@/redux/api/issueApi"
import { useGetStatesQuery } from "@/redux/api/stateApi"
import { cn } from "@/lib/utils"
import type { Module, ModuleStatus, ProjectState } from "@/types/api"

interface ModulesViewProps {
  workspaceSlug: string
  projectId: string
}

const MODULE_STATUS_CONFIG: Record<
  ModuleStatus,
  { label: string; badgeClass: string }
> = {
  backlog: {
    label: "Бэклог",
    badgeClass: "border-border bg-muted/30 text-muted-foreground",
  },
  in_progress: {
    label: "В работе",
    badgeClass: "border-foreground/40 bg-foreground/5 text-foreground font-semibold",
  },
  paused: {
    label: "Приостановлен",
    badgeClass: "border-border bg-muted/40 text-muted-foreground",
  },
  completed: {
    label: "Завершен",
    badgeClass: "border-border bg-muted/20 text-muted-foreground",
  },
  cancelled: {
    label: "Отменен",
    badgeClass: "border-border bg-muted/20 text-muted-foreground line-through opacity-75",
  },
}

function formatModuleDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
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

export default function ModulesView({ workspaceSlug, projectId }: ModulesViewProps) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | ModuleStatus>("all")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState<Module | null>(null)
  const [managingIssuesModule, setManagingIssuesModule] = React.useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = React.useState<Module | null>(null)

  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery({
    workspaceSlug,
    projectId,
  })

  const { data: members = [] } = useGetProjectMembersQuery({
    workspaceSlug,
    projectId,
  })

  const { data: modules = [], isLoading: isLoadingModules } = useGetModulesQuery({
    workspaceSlug,
    projectId,
  })

  const { data: states = [] } = useGetStatesQuery({
    workspaceSlug,
    projectId,
  })

  const [deleteModule, { isLoading: isDeletingModule }] = useDeleteModuleMutation()

  const filteredModules = React.useMemo(() => {
    if (statusFilter === "all") return modules
    return modules.filter((m) => m.status === statusFilter)
  }, [modules, statusFilter])

  const handleDelete = (mod: Module) => {
    setDeletingModule(mod)
  }

  const handleConfirmDelete = async () => {
    if (!deletingModule) return
    try {
      await deleteModule({
        workspaceSlug,
        projectId,
        moduleId: deletingModule.id,
      }).unwrap()
      setDeletingModule(null)
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
              {(
                [
                  { id: "all", label: "Все модули" },
                  { id: "in_progress", label: "В работе" },
                  { id: "backlog", label: "Бэклог" },
                  { id: "paused", label: "Приостановлены" },
                  { id: "completed", label: "Завершены" },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  className={cn(
                    "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer whitespace-nowrap",
                    statusFilter === st.id
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {st.label}
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
              <span>Новый модуль</span>
            </Button>
          </div>

          {/* Modules Content */}
          <div className="p-4 sm:p-6 bg-background/20 min-h-[450px]">
            {isLoadingModules ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 border border-dashed border-border/70 rounded-lg">
                <Boxes className="size-6 text-muted-foreground/60" />
                <h3 className="text-sm font-medium text-foreground">Модули не найдены</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Используйте модули для управления крупными эпиками, дорожной картой и ключевыми инициативами.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                    className="h-8 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
                  >
                    Создать первый модуль
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModules.map((mod) => {
                  const leadMember = members.find((m) => m.user_id === mod.lead_id)
                  return (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      leadMember={leadMember}
                      states={states}
                      onEdit={setEditingModule}
                      onDelete={handleDelete}
                      onManageIssues={setManagingIssuesModule}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateModuleModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditModuleModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        module={editingModule}
        isOpen={!!editingModule}
        onClose={() => setEditingModule(null)}
      />

      <ModuleIssuesModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projectIdentifier={project.identifier}
        module={managingIssuesModule}
        isOpen={!!managingIssuesModule}
        onClose={() => setManagingIssuesModule(null)}
      />

      <DeleteModuleModal
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleConfirmDelete}
        moduleName={deletingModule?.name || ""}
        isLoading={isDeletingModule}
      />
    </div>
  )
}

interface ModuleCardProps {
  mod: Module
  workspaceSlug: string
  projectId: string
  leadMember?: any
  states: ProjectState[]
  onEdit: (mod: Module) => void
  onDelete: (mod: Module) => void
  onManageIssues: (mod: Module) => void
}

function ModuleCard({
  mod,
  workspaceSlug,
  projectId,
  leadMember,
  states,
  onEdit,
  onDelete,
  onManageIssues,
}: ModuleCardProps) {
  // Live query of issues associated with this module
  const { data: moduleIssues = [] } = useGetIssuesQuery({
    workspaceSlug,
    projectId,
    module: mod.id,
  })

  // Dynamic progress calculation from actual bound tasks and their state groups
  const total = moduleIssues.length
  const completed = React.useMemo(() => {
    return moduleIssues.filter((issue) => {
      const st = states.find((s) => s.id === issue.state_id)
      return st?.group === "completed" || !!issue.completed_at
    }).length
  }, [moduleIssues, states])

  const active = React.useMemo(() => {
    return moduleIssues.filter((issue) => {
      const st = states.find((s) => s.id === issue.state_id)
      return st ? st.group === "started" || st.group === "unstarted" || st.group === "backlog" : true
    }).length
  }, [moduleIssues, states])

  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const statusCfg = MODULE_STATUS_CONFIG[mod.status] || MODULE_STATUS_CONFIG.backlog

  return (
    <div className="group rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        {/* Status & Actions Header */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-md border",
              statusCfg.badgeClass
            )}
          >
            {statusCfg.label}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(mod)}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Редактировать"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(mod)}
              className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"
              title="Удалить"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {mod.name}
          </h3>
          {mod.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {mod.description}
            </p>
          )}
        </div>

        {/* Lead and Dates */}
        <div className="flex flex-col gap-1.5 pt-1 text-[11px] text-muted-foreground">
          {leadMember && (
            <div className="flex items-center gap-1.5 font-mono">
              <UserIcon className="size-3" />
              <span className="truncate">
                {leadMember.user?.display_name || leadMember.user?.email || "Руководитель"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="size-3" />
            <span>
              {formatModuleDate(mod.start_date)} — {formatModuleDate(mod.target_date)}
            </span>
          </div>
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
            onClick={() => onManageIssues(mod)}
            className="w-full h-8 text-xs font-medium gap-1.5 cursor-pointer"
          >
            <ListTodo className="size-3.5 text-muted-foreground" />
            <span>Задачи модуля ({total})</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
