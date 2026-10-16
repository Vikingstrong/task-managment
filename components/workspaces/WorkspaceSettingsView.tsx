"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getSentInvites,
  saveSentInvite,
  removeSentInvite,
  addLocalPendingInvite,
  type SentInviteRecord,
} from "@/lib/invites"
import {
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useInviteWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
} from "@/redux/api/workspaceApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { Workspace, WorkspaceRole, WorkspaceInvite } from "@/types/api"

interface WorkspaceSettingsViewProps {
  workspaceSlug: string
}

function GeneralSettingsCard({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [name, setName] = React.useState(workspace.name)
  const [slug, setSlug] = React.useState(workspace.slug)
  const [generalSuccess, setGeneralSuccess] = React.useState(false)
  const [generalError, setGeneralError] = React.useState<string | null>(null)

  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation()

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(false)

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim().toLowerCase()

    if (!trimmedName) {
      setGeneralError("Название не может быть пустым")
      return
    }

    if (!trimmedSlug || !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setGeneralError("Slug может содержать только латинские буквы, цифры и дефис")
      return
    }

    try {
      const updated = await updateWorkspace({
        slug: workspace.slug,
        body: {
          name: trimmedName,
          slug: trimmedSlug,
        },
      }).unwrap()

      setGeneralSuccess(true)
      setTimeout(() => setGeneralSuccess(false), 3000)

      if (updated.slug !== workspace.slug) {
        router.replace(`/${updated.slug}/settings`)
      }
    } catch (err: unknown) {
      setGeneralError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Основные параметры
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Название и публичный URL-идентификатор пространства
        </p>
      </div>

      <form onSubmit={handleGeneralSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ws-name" className="text-xs sm:text-sm font-medium">
            Название пространства
          </Label>
          <Input
            id="ws-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isUpdating}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-slug" className="text-xs sm:text-sm font-medium">
              URL идентификатор (slug)
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              /^[a-z0-9-]+$/
            </span>
          </div>
          <div className="flex items-center rounded-md border border-input bg-transparent px-3 text-xs sm:text-sm shadow-xs focus-within:ring-1 focus-within:ring-ring">
            <span className="text-muted-foreground select-none font-mono text-xs mr-1">
              /
            </span>
            <input
              id="ws-slug"
              type="text"
              required
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              disabled={isUpdating}
              className="w-full bg-transparent py-2.5 text-xs sm:text-sm font-mono outline-hidden placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            При изменении slug адрес пространства обновится для всех участников.
          </p>
        </div>

        {generalError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {generalSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="size-4" />
            <span>Параметры успешно обновлены</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={isUpdating}
            className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isUpdating ? (
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
    </div>
  )
}

export default function WorkspaceSettingsView({
  workspaceSlug,
}: WorkspaceSettingsViewProps) {
  const router = useRouter()

  const { data: currentUser } = useGetMeQuery()
  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    isError: isWorkspaceError,
  } = useGetWorkspaceQuery(workspaceSlug)

  const {
    data: members = [],
    isLoading: isMembersLoading,
  } = useGetWorkspaceMembersQuery(workspaceSlug)

  // Invite Form state
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>("member")
  const [inviteError, setInviteError] = React.useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = React.useState<WorkspaceInvite | null>(null)
  const [copiedLink, setCopiedLink] = React.useState(false)
  const [copiedToken, setCopiedToken] = React.useState(false)
  const [sentInvites, setSentInvites] = React.useState<SentInviteRecord[]>([])

  React.useEffect(() => {
    setSentInvites(getSentInvites(workspaceSlug))
  }, [workspaceSlug])

  // Danger Zone Delete state
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation()
  const [inviteMember, { isLoading: isInviting }] = useInviteWorkspaceMemberMutation()
  const [updateMemberRole] = useUpdateWorkspaceMemberMutation()
  const [removeMember] = useRemoveWorkspaceMemberMutation()

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isWorkspaceError || !workspace) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <p className="text-xs text-destructive font-medium">
          Рабочее пространство не найдено или у вас нет доступа
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Вернуться к списку</span>
        </Link>
      </div>
    )
  }

  const isOwner = currentUser?.id === workspace.owner_id

  const handleCopyLink = (token: string) => {
    if (typeof window === "undefined") return
    const link = `${window.location.origin}/invites/${token}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyToken = (token: string) => {
    if (typeof window === "undefined") return
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleRemoveSentInvite = (token: string) => {
    removeSentInvite(workspaceSlug, token)
    setSentInvites(getSentInvites(workspaceSlug))
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)

    if (!inviteEmail.trim()) {
      setInviteError("Введите корректный email")
      return
    }

    try {
      const newInvite = await inviteMember({
        workspaceSlug,
        email: inviteEmail.trim(),
        role: inviteRole,
      }).unwrap()

      setCreatedInvite(newInvite)
      setInviteEmail("")

      const record: SentInviteRecord = {
        id: newInvite.id,
        email: newInvite.email,
        role: newInvite.role,
        token: newInvite.token,
        workspaceSlug,
        createdAt: newInvite.created_at || new Date().toISOString(),
        expiresAt: newInvite.expires_at,
      }

      saveSentInvite(workspaceSlug, record)
      addLocalPendingInvite({
        token: newInvite.token,
        email: newInvite.email,
        workspaceSlug,
        workspaceName: workspace.name,
        role: newInvite.role,
        createdAt: record.createdAt,
        expiresAt: newInvite.expires_at,
      })

      setSentInvites(getSentInvites(workspaceSlug))
    } catch (err: unknown) {
      setInviteError(getAuthErrorMessage(err))
    }
  }

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    try {
      await updateMemberRole({
        workspaceSlug,
        userId,
        role: newRole,
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Вы действительно хотите удалить ${memberName} из пространства?`)) {
      return
    }

    try {
      await removeMember({
        workspaceSlug,
        userId,
      }).unwrap()
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    }
  }

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteError(null)

    if (deleteConfirmation !== workspace.slug) {
      setDeleteError(`Для подтверждения введите "${workspace.slug}"`)
      return
    }

    try {
      await deleteWorkspace(workspace.slug).unwrap()
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setDeleteError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-8">
        {/* Top Breadcrumb & Title */}
        <div className="space-y-2 border-b border-border pb-5">
          <Link
            href={`/${workspaceSlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Назад к проектам пространства</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg border border-border bg-muted/40 font-mono text-sm font-medium text-foreground flex items-center justify-center uppercase select-none">
              {workspace.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Настройки пространства
              </h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                /{workspace.slug}
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Grid Layout: Left Column (General + Danger), Right Column (Members) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. General Info Card */}
            <GeneralSettingsCard key={workspace.id} workspace={workspace} />

            {/* 2. Danger Zone Card */}
            {isOwner && (
              <div className="rounded-xl border border-destructive/20 bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="size-4 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-destructive">
                      Опасная зона: Удаление пространства
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Удаление приведет к безвозвратной потере всех проектов, задач, спринтов и истории активности. Это действие нельзя отменить.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleDeleteWorkspace}
                  className="space-y-3.5 pt-3 border-t border-destructive/10"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="del-slug" className="text-xs text-muted-foreground">
                      Для подтверждения введите имя slug:{" "}
                      <code className="text-foreground font-mono font-medium">
                        {workspace.slug}
                      </code>
                    </Label>
                    <Input
                      id="del-slug"
                      type="text"
                      required
                      placeholder={workspace.slug}
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      disabled={isDeleting}
                      className="h-9 text-xs sm:text-sm font-mono w-full"
                    />
                  </div>

                  {deleteError && (
                    <p className="text-xs text-destructive font-medium">
                      {deleteError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting || deleteConfirmation !== workspace.slug}
                    className="h-9 text-xs font-medium cursor-pointer w-full sm:w-auto"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Удаление...</span>
                      </>
                    ) : (
                      "Удалить рабочее пространство"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Members Management Card */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Users className="size-4" />
                    <span>Участники пространства</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Управление доступом, ролями и приглашение коллег
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground self-start sm:self-auto rounded-md bg-muted/60 px-2.5 py-1 border border-border">
                  Всего: {members.length}
                </span>
              </div>

              {/* Invite form */}
              <form
                onSubmit={handleInviteSubmit}
                className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3.5"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
                  <UserPlus className="size-4" />
                  <span>Пригласить нового участника</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <Input
                      type="email"
                      required
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={isInviting}
                      className="h-9 text-xs sm:text-sm bg-card"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                      disabled={isInviting}
                      className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="member">Участник</option>
                      <option value="admin">Администратор</option>
                      <option value="guest">Гость</option>
                    </select>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isInviting}
                      className="h-9 text-xs px-3.5 bg-foreground text-background hover:bg-foreground/90 shrink-0 cursor-pointer"
                    >
                      {isInviting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Пригласить"
                      )}
                    </Button>
                  </div>
                </div>

                {inviteError && (
                  <p className="text-xs text-destructive font-medium tracking-tight">
                    {inviteError}
                  </p>
                )}

                {createdInvite && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Приглашение успешно отправлено
                  </p>
                )}
              </form>

              {/* Prominent Generated Invite Card */}
              {createdInvite && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground">
                        <Check className="size-4 text-emerald-500" />
                        <span>Приглашение для {createdInvite.email} создано!</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Поскольку реальный SMTP-сервер не подключен, скопируйте ссылку или токен и отправьте получателю напрямую:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreatedInvite(null)}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      title="Скрыть карточку"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Link Row */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Прямая ссылка на страницу приглашения:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/invites/${createdInvite.token}`
                            : `/invites/${createdInvite.token}`
                        }
                        className="h-8 text-xs font-mono bg-card select-all"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(createdInvite.token)}
                        className="h-8 text-xs gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="size-3.5 text-emerald-500" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Скопировать ссылку</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Token Row */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Код токена:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={createdInvite.token}
                        className="h-8 text-xs font-mono bg-card select-all"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToken(createdInvite.token)}
                        className="h-8 text-xs gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="size-3.5 text-emerald-500" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="size-3.5" />
                            <span>Скопировать токен</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sent Invites History */}
              {sentInvites.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-muted-foreground" />
                      <span>Отправленные приглашения ({sentInvites.length})</span>
                    </h3>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Сохранены локально
                    </span>
                  </div>

                  <div className="divide-y divide-border/60">
                    {sentInvites.map((inv) => (
                      <div
                        key={inv.token}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {inv.email}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                              {inv.role}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground truncate">
                            Токен: {inv.token.slice(0, 16)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyLink(inv.token)}
                            className="h-7 px-2 text-xs gap-1 cursor-pointer"
                            title="Скопировать ссылку"
                          >
                            <Copy className="size-3" />
                            <span>Ссылка</span>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSentInvite(inv.token)}
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Удалить из истории"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="space-y-2">
                {isMembersLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground mx-auto" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">
                    Список участников пуст
                  </p>
                ) : (
                  <div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
                    {members.map((member) => {
                      const isWorkspaceOwner = member.role === "owner"
                      const isCurrent = member.user_id === currentUser?.id

                      return (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3.5 bg-card hover:bg-muted/10 transition-colors text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="size-8 border border-border">
                              {member.user?.avatar_url && (
                                <AvatarImage
                                  src={member.user.avatar_url}
                                  alt={member.user.display_name}
                                />
                              )}
                              <AvatarFallback className="text-xs font-mono">
                                {member.user?.display_name
                                  ? member.user.display_name.charAt(0).toUpperCase()
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground truncate">
                                  {member.user?.display_name || "Участник"}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.2 text-muted-foreground">
                                    Вы
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate block">
                                {member.user?.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isWorkspaceOwner ? (
                              <span className="text-xs font-medium text-muted-foreground border border-border rounded px-2.5 py-1 bg-muted/40">
                                Владелец
                              </span>
                            ) : (
                              <select
                                value={member.role}
                                disabled={!isOwner}
                                onChange={(e) =>
                                  handleRoleChange(
                                    member.user_id,
                                    e.target.value as WorkspaceRole
                                  )
                                }
                                className="h-8 rounded-md border border-input bg-card px-2 text-xs outline-hidden focus:ring-1 focus:ring-ring"
                              >
                                <option value="admin">Администратор</option>
                                <option value="member">Участник</option>
                                <option value="guest">Гость</option>
                              </select>
                            )}

                            {!isWorkspaceOwner && isOwner && (
                              <button
                                type="button"
                                title="Удалить из пространства"
                                onClick={() =>
                                  handleRemoveMember(
                                    member.user_id,
                                    member.user?.display_name || "пользователя"
                                  )
                                }
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
