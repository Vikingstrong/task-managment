"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  FolderKanban,
  KeyRound,
  Loader2,
  Plus,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useGetWorkspacesQuery } from "@/redux/api/workspaceApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { useAcceptInviteMutation } from "@/redux/api/inviteApi"
import {
  getPendingInvitesForEmail,
  removeLocalPendingInvite,
  subscribeToLocalInvites,
  type PendingInviteRecord,
} from "@/lib/invites"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { CreateWorkspaceModal } from "./CreateWorkspaceModal"
import { JoinByInviteModal } from "./JoinByInviteModal"
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
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false)
  const [acceptingToken, setAcceptingToken] = React.useState<string | null>(null)

  const { data: currentUser } = useGetMeQuery()

  const {
    data: workspaces = [],
    isLoading,
    isError,
    refetch,
  } = useGetWorkspacesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  const [acceptInvite] = useAcceptInviteMutation()

  // Local pending invites detection
  const [pendingInvites, setPendingInvites] = React.useState<PendingInviteRecord[]>([])

  const updatePending = React.useCallback(() => {
    if (currentUser?.email) {
      setPendingInvites(getPendingInvitesForEmail(currentUser.email))
    } else {
      setPendingInvites([])
    }
  }, [currentUser?.email])

  React.useEffect(() => {
    updatePending()
    const unsubscribe = subscribeToLocalInvites(() => {
      updatePending()
    })
    return unsubscribe
  }, [updatePending])

  const handleCreated = (newWorkspace: Workspace) => {
    router.push(`/${newWorkspace.slug}`)
  }

  const handleAcceptDirect = async (token: string, targetSlug: string) => {
    setAcceptingToken(token)
    try {
      await acceptInvite(token).unwrap()
      removeLocalPendingInvite(token)
      setPendingInvites((prev) => prev.filter((i) => i.token !== token))
      refetch()
      router.push(`/${targetSlug}`)
    } catch (err: unknown) {
      alert(getAuthErrorMessage(err))
    } finally {
      setAcceptingToken(null)
    }
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

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsJoinModalOpen(true)}
              className="h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="size-3.5 text-muted-foreground" />
              <span>Вступить по коду</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="size-3.5" />
              <span>Создать воркспейс</span>
            </Button>
          </div>
        </div>

        {/* Pending Invites Banner for Current User */}
        {pendingInvites.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Вам доступны приглашения в пространства ({pendingInvites.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Ожидают подтверждения
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.token}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {inv.workspaceName}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">
                        {inv.role}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      /{inv.workspaceSlug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      disabled={acceptingToken === inv.token}
                      onClick={() => handleAcceptDirect(inv.token, inv.workspaceSlug)}
                      className="flex-1 h-8 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
                    >
                      {acceptingToken === inv.token ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      <span>Принять</span>
                    </Button>
                    <Link
                      href={`/invites/${inv.token}`}
                      className="inline-flex items-center justify-center h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium rounded-md border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs cursor-pointer"
            >
              Повторить попытку
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && workspaces.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
            <div className="size-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <FolderKanban className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                У вас пока нет рабочих пространств
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Создайте собственное рабочее пространство или введите код приглашения, чтобы присоединиться к существующей команде.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsJoinModalOpen(true)}
                className="h-9 px-4 text-xs font-medium cursor-pointer"
              >
                <KeyRound className="size-3.5 mr-1.5 text-muted-foreground" />
                Ввести код
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
              >
                <Plus className="size-3.5 mr-1.5" />
                Создать воркспейс
              </Button>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {!isLoading && !isError && workspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/${workspace.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/40 hover:shadow-xs"
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
        key={isCreateModalOpen ? "create-open" : "create-closed"}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreated}
      />

      <JoinByInviteModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
