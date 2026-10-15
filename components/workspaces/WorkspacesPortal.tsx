"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowUpRight,
  FolderKanban,
  Loader2,
  Plus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useGetWorkspacesQuery } from "@/redux/api/workspaceApi"
import { CreateWorkspaceModal } from "./CreateWorkspaceModal"
import type { Workspace } from "@/types/api"

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d)
  } catch {
    return dateString
  }
}




export default function WorkspacesPortal() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const {
    data: workspaces = [],
    isLoading,
    isError,
    refetch,
  } = useGetWorkspacesQuery()

  const handleCreated = (newWorkspace: Workspace) => {
    router.push(`/${newWorkspace.slug}`)
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Рабочие пространства
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
              Выберите рабочее пространство для управления проектами и задачами
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 self-start sm:self-auto gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Создать воркспейс</span>
          </Button>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-md bg-muted/50 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-24 bg-muted/50 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted/40 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-2.5 w-20 bg-muted/30 rounded animate-pulse pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="rounded-lg border border-destructive/20 bg-card p-5 text-center space-y-3">
            <p className="text-xs text-destructive font-medium">
              Не удалось загрузить список рабочих пространств
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs cursor-pointer"
            >
              Попробовать снова
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && workspaces.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 sm:p-14 text-center">
            <div className="size-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center mx-auto text-muted-foreground mb-3">
              <FolderKanban className="size-5" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-foreground">
              Нет рабочих пространств
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
              У вас пока нет ни одного рабочего пространства. Давайте создадим первое, чтобы начать работу с проектами и задачами.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-8 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Создать первое пространство</span>
            </Button>
          </div>
        )}

        {/* Workspaces Grid */}
        {!isLoading && !isError && workspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/${workspace.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/25 hover:shadow-sm hover:bg-muted/10 cursor-pointer shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg border border-border bg-muted/40 font-mono text-xs font-medium text-foreground flex items-center justify-center shrink-0 uppercase select-none">
                        {workspace.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium text-foreground group-hover:text-foreground/90 truncate">
                          {workspace.name}
                        </h2>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          /{workspace.slug}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-0.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded">
                    Активно
                  </span>
                  <span>{formatDate(workspace.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        key={isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  )
}
