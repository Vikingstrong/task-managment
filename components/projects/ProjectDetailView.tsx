"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Users,
} from "lucide-react"

import { useGetProjectQuery, useGetProjectMembersQuery } from "@/redux/api/projectApi"
import { ProjectNavTabs } from "@/components/projects/ProjectNavTabs"
import { ProjectMembersModal } from "@/components/projects/ProjectMembersModal"
import KanbanBoard from "@/components/issues/KanbanBoard"

interface ProjectDetailViewProps {
  workspaceSlug: string
  projectId: string
}

export default function ProjectDetailView({
  workspaceSlug,
  projectId,
}: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState<"board" | "list">("board")
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false)

  const { data: project, isLoading, isError } = useGetProjectQuery({
    workspaceSlug,
    projectId,
  })

  const { data: members = [] } = useGetProjectMembersQuery({
    workspaceSlug,
    projectId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <p className="text-xs text-destructive font-medium">
          Проект не найден или у вас нет к нему доступа
        </p>
        <Link
          href={`/${workspaceSlug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Вернуться к проектам</span>
        </Link>
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
              {project.is_archived && (
                <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted/50">
                  Архивирован
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <button
              type="button"
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 shadow-2xs hover:bg-muted/60 transition-colors text-foreground cursor-pointer"
              title="Управление составом команды проекта"
            >
              <Users className="size-3.5 text-muted-foreground" />
              <span>{members.length} участников</span>
              <span className="text-[10px] text-muted-foreground font-sans underline underline-offset-2 ml-0.5">
                Настроить
              </span>
            </button>
          </div>
        </div>

        {/* Project Workflow Container */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-all">
          <ProjectNavTabs workspaceSlug={workspaceSlug} projectId={projectId} />

          {/* High-Performance Board / List Sub-Toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/10 px-4 sm:px-6 py-2">
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("board")}
                className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeTab === "board"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Канбан-доска
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeTab === "list"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Список задач
              </button>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
              {project.identifier} · Задачи
            </div>
          </div>

          {/* Kanban / Tasks Content */}
          <div className="p-4 sm:p-6 bg-background/20 min-h-[450px]">
            <KanbanBoard
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              projectIdentifier={project.identifier}
              viewLayout={activeTab}
            />
          </div>
        </div>

        {/* Project Members Modal */}
        <ProjectMembersModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          projectIdentifier={project.identifier}
          projectName={project.name}
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
        />
      </div>
    </div>
  )
}
