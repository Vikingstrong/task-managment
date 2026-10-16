"use client"

import * as React from "react"
import {
  AlertCircle,
  Check,
  Crown,
  Eye,
  Loader2,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MacModal } from "@/components/common/MacModal"
import {
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
} from "@/redux/api/projectApi"
import { useGetWorkspaceMembersQuery } from "@/redux/api/workspaceApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { ProjectRole, WorkspaceMember, ProjectMember } from "@/types/api"

export interface ProjectMembersModalProps {
  workspaceSlug: string
  projectId: string
  projectIdentifier: string
  projectName: string
  isOpen: boolean
  onClose: () => void
}

function roleBadge(role: ProjectRole) {
  switch (role) {
    case "admin":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-muted/60 border border-border px-2 py-0.5 text-[11px] font-mono font-medium text-foreground">
          <Shield className="size-3 text-muted-foreground" />
          Администратор
        </span>
      )
    case "viewer":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-muted/40 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
          <Eye className="size-3 text-muted-foreground" />
          Наблюдатель
        </span>
      )
    case "member":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-muted/40 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
          Участник
        </span>
      )
  }
}

export function ProjectMembersModal({
  workspaceSlug,
  projectId,
  projectIdentifier,
  projectName,
  isOpen,
  onClose,
}: ProjectMembersModalProps) {
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [selectedRole, setSelectedRole] = React.useState<ProjectRole>("member")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(null)

  const { data: currentUser } = useGetMeQuery()

  const {
    data: projectMembers = [],
    isLoading: isProjectMembersLoading,
  } = useGetProjectMembersQuery(
    { workspaceSlug, projectId },
    { skip: !isOpen }
  )

  const {
    data: workspaceMembers = [],
    isLoading: isWorkspaceMembersLoading,
  } = useGetWorkspaceMembersQuery(workspaceSlug, {
    skip: !isOpen,
  })

  const [addMember, { isLoading: isAdding }] = useAddProjectMemberMutation()
  const [removeMember, { isLoading: isRemoving }] = useRemoveProjectMemberMutation()

  // Filter workspace members not yet in this project
  const availableWorkspaceMembers = React.useMemo(() => {
    const existingIds = new Set(projectMembers.map((pm: ProjectMember) => pm.user_id))
    return workspaceMembers.filter((wm: WorkspaceMember) => !existingIds.has(wm.user_id))
  }, [projectMembers, workspaceMembers])

  React.useEffect(() => {
    if (isOpen) {
      setSelectedUserId(availableWorkspaceMembers[0]?.user_id || "")
      setSelectedRole("member")
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, availableWorkspaceMembers])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!selectedUserId) {
      setErrorMessage("Выберите пользователя для добавления")
      return
    }

    try {
      await addMember({
        workspaceSlug,
        projectId,
        body: {
          user_id: selectedUserId,
          role: selectedRole,
        },
      }).unwrap()

      setSuccessMessage("Участник успешно добавлен в проект")
      setSelectedUserId("")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Удалить ${userName} из команды проекта?`)) {
      return
    }

    setRemovingUserId(userId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await removeMember({
        workspaceSlug,
        projectId,
        userId,
      }).unwrap()

      setSuccessMessage("Участник удален из проекта")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    } finally {
      setRemovingUserId(null)
    }
  }

  const isLoading = isProjectMembersLoading || isWorkspaceMembersLoading

  return (
    <MacModal
      id="modal-project-members"
      isOpen={isOpen}
      onClose={onClose}
      title="Команда проекта"
      subtitle={`${projectName} (${projectIdentifier})`}
      tag={`${projectMembers.length} уч.`}
      defaultWidth="max-w-2xl"
      maximizedWidth="max-w-3xl"
    >
      <div className="p-6 sm:p-7 space-y-6">
        {/* Status Messages */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Add Member Section */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserPlus className="size-3.5" />
              Добавить участника из пространства
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Доступно: {availableWorkspaceMembers.length}
            </span>
          </div>

          {availableWorkspaceMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Все участники рабочего пространства уже добавлены в этот проект.
            </p>
          ) : (
            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1">
                <Label htmlFor="select-user" className="text-xs font-medium">
                  Сотрудник
                </Label>
                <select
                  id="select-user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isAdding}
                  className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground shadow-2xs focus:ring-1 focus:ring-ring outline-hidden cursor-pointer"
                >
                  <option value="" disabled>
                    Выберите пользователя...
                  </option>
                  {availableWorkspaceMembers.map((wm: WorkspaceMember) => (
                    <option key={wm.user_id} value={wm.user_id}>
                      {wm.user?.display_name || wm.user?.email || wm.user_id} ({wm.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label htmlFor="select-role" className="text-xs font-medium">
                  Роль в проекте
                </Label>
                <select
                  id="select-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                  disabled={isAdding}
                  className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground shadow-2xs focus:ring-1 focus:ring-ring outline-hidden cursor-pointer"
                >
                  <option value="member">Участник</option>
                  <option value="admin">Администратор</option>
                  <option value="viewer">Наблюдатель</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAdding || !selectedUserId}
                  className="w-full h-9 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isAdding ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      <span>Добавить</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* 2. Members List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Текущие участники проекта ({projectMembers.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-foreground" />
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center text-xs text-muted-foreground">
              В проекте пока нет участников.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-2xs">
              {projectMembers.map((member: ProjectMember) => {
                const isCurrent = currentUser?.id === member.user_id
                const isThisRemoving = isRemoving && removingUserId === member.user_id

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 sm:px-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-8 rounded-md border border-border">
                        {member.user?.avatar_url && (
                          <AvatarImage src={member.user.avatar_url} />
                        )}
                        <AvatarFallback className="rounded-md font-mono text-xs uppercase bg-muted text-foreground">
                          {member.user?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {member.user?.display_name || "Пользователь"}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                              вы
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {member.user?.email || member.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {roleBadge(member.role)}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isThisRemoving}
                        onClick={() =>
                          handleRemoveMember(
                            member.user_id,
                            member.user?.display_name || "пользователя"
                          )
                        }
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Удалить из проекта"
                      >
                        {isThisRemoving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MacModal>
  )
}
