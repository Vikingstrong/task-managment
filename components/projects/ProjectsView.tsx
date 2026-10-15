"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  ArrowUpDown,
  FolderPlus,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "@/redux/api/projectApi"
import { useGetWorkspaceMembersQuery } from "@/redux/api/workspaceApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { MacModal } from "@/components/common/MacModal"
import type { Project } from "@/types/api"


function generateProjectIdentifier(name: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "A", б: "B", в: "V", г: "G", д: "D", е: "E", ё: "E", ж: "ZH",
    з: "Z", и: "I", й: "Y", к: "K", л: "L", м: "M", н: "N", о: "O",
    п: "P", р: "R", с: "S", т: "T", у: "U", ф: "F", х: "KH", ц: "TS",
    ч: "CH", ш: "SH", щ: "SH", ъ: "", ы: "Y", ь: "", э: "E", ю: "YU", я: "YA",
  }

  const latinized = name
    .split("")
    .map((c) => cyrillicMap[c.toLowerCase()] || c.toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, " ")
    .trim()

  const words = latinized.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const letters = words.map((w) => w[0]).join("").slice(0, 5)
    if (letters.length >= 2) return letters
  }

  const single = latinized.replace(/\s+/g, "").slice(0, 4)
  return single || "PRJ"
}

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

interface CreateModalProps {
  workspaceSlug: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (project: Project) => void
}

function CreateProjectModal({
  workspaceSlug,
  isOpen,
  onClose,
  onSuccess,
}: CreateModalProps) {
  const [name, setName] = React.useState("")
  const [identifier, setIdentifier] = React.useState("")
  const [isIdentifierEdited, setIsIdentifierEdited] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [leadId, setLeadId] = React.useState<string>("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const { data: members = [] } = useGetWorkspaceMembersQuery(workspaceSlug)
  const [createProject, { isLoading }] = useCreateProjectMutation()

  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setIdentifier("")
      setIsIdentifierEdited(false)
      setDescription("")
      setLeadId("")
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isIdentifierEdited) {
      setIdentifier(generateProjectIdentifier(val))
    }
  }

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsIdentifierEdited(true)
    setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    const trimmedId = identifier.trim().toUpperCase()

    if (!trimmedName) {
      setErrorMessage("Введите название проекта")
      return
    }

    if (!trimmedId || !/^[A-Z0-9]+$/.test(trimmedId)) {
      setErrorMessage("Идентификатор должен содержать только заглавные латинские буквы и цифры")
      return
    }

    try {
      const created = await createProject({
        workspaceSlug,
        body: {
          name: trimmedName,
          identifier: trimmedId,
          description: description.trim() || null,
          lead_id: leadId || null,
        },
      }).unwrap()

      onSuccess(created)
      onClose()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Новый проект"
      subtitle="Создайте проект для отслеживания задач, спринтов и дорожной карты"
      defaultWidth="max-w-2xl sm:max-w-3xl"
      maximizedWidth="max-w-5xl"
    >
      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="proj-name" className="text-xs sm:text-sm font-medium">
              Название проекта
            </Label>
            <Input
              id="proj-name"
              type="text"
              required
              autoFocus
              placeholder="Например, Мобильное приложение"
              value={name}
              onChange={handleNameChange}
              disabled={isLoading}
              className="h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="proj-id" className="text-xs sm:text-sm font-medium">
                Ключ проекта
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                [A-Z0-9]
              </span>
            </div>
            <Input
              id="proj-id"
              type="text"
              required
              placeholder="APP"
              value={identifier}
              onChange={handleIdentifierChange}
              disabled={isLoading}
              className="h-10 text-xs sm:text-sm font-mono uppercase"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proj-desc" className="text-xs sm:text-sm font-medium">
            Описание проекта (опционально)
          </Label>
          <textarea
            id="proj-desc"
            rows={3}
            placeholder="Краткое описание целей, состава команды и рамок проекта..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs sm:text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring outline-hidden placeholder:text-muted-foreground resize-y min-h-[80px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proj-lead" className="text-xs sm:text-sm font-medium">
            Руководитель проекта (Lead)
          </Label>
          <select
            id="proj-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            disabled={isLoading}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">Не назначен</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user?.display_name || m.user?.email} ({m.role})
              </option>
            ))}
          </select>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Создание...</span>
              </>
            ) : (
              "Создать проект"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}

interface EditModalProps {
  workspaceSlug: string
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

function EditProjectModal({
  workspaceSlug,
  project,
  isOpen,
  onClose,
}: EditModalProps) {
  const [name, setName] = React.useState(project?.name || "")
  const [description, setDescription] = React.useState(project?.description || "")
  const [leadId, setLeadId] = React.useState(project?.lead_id || "")
  const [isArchived, setIsArchived] = React.useState(project?.is_archived || false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const { data: members = [] } = useGetWorkspaceMembersQuery(workspaceSlug)
  const [updateProject, { isLoading }] = useUpdateProjectMutation()

  React.useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || "")
      setLeadId(project.lead_id || "")
      setIsArchived(project.is_archived)
      setErrorMessage(null)
    }
  }, [project])

  if (!project) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Введите название проекта")
      return
    }

    try {
      await updateProject({
        workspaceSlug,
        projectId: project.id,
        body: {
          name: trimmedName,
          description: description.trim() || null,
          lead_id: leadId || null,
          is_archived: isArchived,
        },
      }).unwrap()

      onClose()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Настройки проекта ${project.identifier}`}
      subtitle="Изменение параметров, руководителя и статуса архивации"
      tag={project.identifier}
      defaultWidth="max-w-2xl sm:max-w-3xl"
      maximizedWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name" className="text-xs sm:text-sm font-medium">
            Название проекта
          </Label>
          <Input
            id="edit-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-desc" className="text-xs sm:text-sm font-medium">
            Описание проекта
          </Label>
          <textarea
            id="edit-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs sm:text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring outline-hidden placeholder:text-muted-foreground resize-y min-h-[80px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-lead" className="text-xs sm:text-sm font-medium">
            Руководитель проекта (Lead)
          </Label>
          <select
            id="edit-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            disabled={isLoading}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">Не назначен</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user?.display_name || m.user?.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-3">
          <input
            id="edit-archive"
            type="checkbox"
            checked={isArchived}
            onChange={(e) => setIsArchived(e.target.checked)}
            disabled={isLoading}
            className="size-4 rounded border-border text-foreground focus:ring-ring cursor-pointer"
          />
          <Label htmlFor="edit-archive" className="text-xs sm:text-sm cursor-pointer select-none">
            Архивировать проект (скрыть из списка активных проектов)
          </Label>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}

interface ProjectsViewProps {
  workspaceSlug: string
}

export default function ProjectsView({ workspaceSlug }: ProjectsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [tab, setTab] = React.useState<"all" | "active" | "archived">("active")
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name" | "key">("newest")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  // Fetch all projects for workspace to enable instant client-side filtering and counting
  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
  } = useGetProjectsQuery({
    workspaceSlug,
  })

  const { data: members = [] } = useGetWorkspaceMembersQuery(workspaceSlug)
  const [deleteProject] = useDeleteProjectMutation()
  const [updateProject] = useUpdateProjectMutation()

  const membersMap = React.useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((m) => {
      map.set(m.user_id, m.user?.display_name || m.user?.email || "Участник")
    })
    return map
  }, [members])

  // Real-time project counts
  const activeCount = React.useMemo(
    () => projects.filter((p) => !p.is_archived).length,
    [projects]
  )
  const archivedCount = React.useMemo(
    () => projects.filter((p) => p.is_archived).length,
    [projects]
  )

  // Instant reactive client-side filtering & sorting
  const filteredProjects = React.useMemo(() => {
    let list = [...projects]

    // Tab filter
    if (tab === "active") {
      list = list.filter((p) => !p.is_archived)
    } else if (tab === "archived") {
      list = list.filter((p) => p.is_archived)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.identifier.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ru")
      }
      if (sortBy === "key") {
        return a.identifier.localeCompare(b.identifier)
      }
      return 0
    })

    return list
  }, [projects, tab, searchQuery, sortBy])

  const handleCardClick = (projectId: string) => {
    router.push(`/${workspaceSlug}/${projectId}`)
  }

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()

    if (
      !confirm(
        `Вы уверены, что хотите удалить проект "${project.name}" (${project.identifier})?`
      )
    ) {
      return
    }

    try {
      await deleteProject({
        workspaceSlug,
        projectId: project.id,
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  const handleToggleArchive = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()

    try {
      await updateProject({
        workspaceSlug,
        projectId: project.id,
        body: {
          is_archived: !project.is_archived,
        },
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      {/* High-Performance Projects Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all">
        {/* Workspace Projects Header Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border bg-muted/20 px-4 sm:px-6 py-3.5 select-none">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Все проекты
            </h2>
            <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {projects.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            {/* Segmented Control with Real-Time Counters */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  tab === "active"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Активные</span>
                <span className="rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted/60 text-muted-foreground">
                  {activeCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("all")}
                className={`rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  tab === "all"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Все</span>
                <span className="rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted/60 text-muted-foreground">
                  {projects.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("archived")}
                className={`rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  tab === "archived"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Архив</span>
                <span className="rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted/60 text-muted-foreground">
                  {archivedCount}
                </span>
              </button>
            </div>

            {/* Sorting Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 rounded-md border border-input bg-card px-2.5 pr-7 text-xs text-foreground cursor-pointer outline-hidden focus:ring-1 focus:ring-ring appearance-none"
                title="Сортировка проектов"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="name">По имени (А-Я)</option>
                <option value="key">По ключу (A-Z)</option>
              </select>
              <ArrowUpDown className="size-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по названию или ключу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full sm:w-52 md:w-60 rounded-md border border-input bg-card pl-8 pr-3 text-xs outline-hidden focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Новый проект</span>
            </Button>
          </div>
        </div>


        {/* Interior Grid of Projects */}
        <div className="p-4 sm:p-6 bg-background/30 min-h-[300px]">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-12 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-muted/40 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-32 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="rounded-xl border border-destructive/20 bg-card p-6 text-center space-y-2">
              <p className="text-xs text-destructive font-medium">
                Не удалось загрузить список проектов
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-8 text-xs cursor-pointer"
              >
                Повторить
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredProjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/20 p-8 sm:p-14 text-center">
              <div className="size-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center mx-auto text-muted-foreground mb-3">
                <FolderPlus className="size-5" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-foreground">
                {searchQuery
                  ? "Ничего не найдено"
                  : tab === "archived"
                  ? "В архиве пока нет проектов"
                  : "В этом пространстве пока нет проектов"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                {searchQuery
                  ? "Попробуйте изменить поисковый запрос"
                  : "Создайте проект, чтобы объединить задачи, настроить жизненный цикл и отслеживать прогресс."}
              </p>
              {!searchQuery && tab !== "archived" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="h-8 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Создать первый проект</span>
                </Button>
              )}
            </div>
          )}

          {/* Projects Cards Grid: WHOLE CARD IS CLICKABLE */}
          {!isLoading && !isError && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map((project) => {
                const leadName = project.lead_id
                  ? membersMap.get(project.lead_id)
                  : null

                return (
                  <div
                    key={project.id}
                    onClick={() => handleCardClick(project.id)}
                    className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-xs cursor-pointer select-none"
                  >
                    <div>
                      {/* Top Bar with Identifier & Actions Menu */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border bg-muted/40 text-foreground tracking-wide">
                          {project.identifier}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {project.is_archived && (
                            <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.2 bg-muted/50">
                              Архив
                            </span>
                          )}

                          {/* Dedicated Action Menu for Project */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground outline-hidden cursor-pointer"
                              title="Действия с проектом"
                            >
                              <MoreVertical className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 p-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingProject(project)
                                }}
                                className="cursor-pointer text-xs flex items-center justify-between rounded-md py-1.5 px-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Pencil className="size-3.5 text-muted-foreground" />
                                  <span>Редактировать</span>
                                </div>
                                <span className="size-2 rounded-full bg-[#007aff]" title="Редактировать" />
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => handleToggleArchive(e, project)}
                                className="cursor-pointer text-xs flex items-center justify-between rounded-md py-1.5 px-2"
                              >
                                <div className="flex items-center gap-2">
                                  {project.is_archived ? (
                                    <>
                                      <ArchiveRestore className="size-3.5 text-muted-foreground" />
                                      <span>Восстановить</span>
                                    </>
                                  ) : (
                                    <>
                                      <Archive className="size-3.5 text-muted-foreground" />
                                      <span>В архив</span>
                                    </>
                                  )}
                                </div>
                                <span
                                  className={`size-2 rounded-full ${
                                    project.is_archived ? "bg-[#27c93f]" : "bg-[#ffbd2e]"
                                  }`}
                                  title={project.is_archived ? "Восстановить" : "В архив"}
                                />
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1" />

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => handleDelete(e, project)}
                                className="cursor-pointer text-xs flex items-center justify-between rounded-md py-1.5 px-2 text-destructive focus:text-destructive"
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="size-3.5" />
                                  <span>Удалить проект</span>
                                </div>
                                <span className="size-2 rounded-full bg-[#ff5f56]" title="Удалить" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Project Title */}
                      <h3 className="font-medium text-sm text-foreground group-hover:text-foreground/90 line-clamp-1">
                        {project.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed min-h-[2rem]">
                        {project.description || "Без описания"}
                      </p>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 mt-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate">
                        {leadName ? (
                          <>
                            <UserIcon className="size-3 text-muted-foreground" />
                            <span className="truncate">{leadName}</span>
                          </>
                        ) : (
                          <span>{formatDate(project.created_at)}</span>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground group-hover:translate-x-0.5 transition-transform shrink-0">
                        <span>Открыть</span>
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateProjectModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        workspaceSlug={workspaceSlug}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
      />

      {/* Edit Modal */}
      <EditProjectModal
        key={editingProject ? editingProject.id : "edit-closed"}
        workspaceSlug={workspaceSlug}
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
      />
    </div>
  )
}
