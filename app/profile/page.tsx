"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard"
import { useGetMeQuery, useUpdateMeMutation, useLogoutMutation } from "@/redux/api/authApi"
import { useAppDispatch } from "@/redux/hooks"
import { baseApi } from "@/redux/api/baseApi"
import { logout as clientLogout } from "@/redux/features/authSlice"
import { logout as serverLogout } from "@/actions/auth"
import { getStoredTokens } from "@/lib/auth/cookies"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { cn } from "@/lib/utils"
import type { User } from "@/types/api"

function ProfileInfoCard({ user }: { user: User }) {
  const [displayName, setDisplayName] = React.useState(user.display_name || "")
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatar_url || "")
  const [profileSuccess, setProfileSuccess] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)

  const [updateMe, { isLoading: isUpdatingProfile }] = useUpdateMeMutation()

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)

    try {
      await updateMe({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || null,
      }).unwrap()

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: unknown) {
      setProfileError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7">
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="size-14 border border-border">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-base font-medium">
            {displayName ? displayName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {displayName || "Пользователь"}
          </h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display_name" className="text-xs sm:text-sm font-medium">
            Имя пользователя
          </Label>
          <Input
            id="display_name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Имя"
            disabled={isUpdatingProfile}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        {/* Email (Readonly) */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="h-10 text-xs sm:text-sm bg-muted/30 cursor-not-allowed opacity-80"
          />
          <span className="text-[11px] text-muted-foreground">
            Email привязан к вашей учетной записи и не подлежит изменению
          </span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="avatar_url" className="text-xs sm:text-sm font-medium">
            Ссылка на аватар (опционально)
          </Label>
          <Input
            id="avatar_url"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            disabled={isUpdatingProfile}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        {profileError && (
          <p className="text-xs text-destructive font-medium tracking-tight">
            {profileError}
          </p>
        )}

        {profileSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <Check className="size-3.5" />
            <span>Профиль успешно сохранен</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isUpdatingProfile}
            className="h-9 px-4 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors text-xs cursor-pointer"
          >
            {isUpdatingProfile ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Сохранение...</span>
              </div>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function AccountOverviewCard({ user }: { user: User }) {
  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Сведения об аккаунте</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1 p-3 rounded-lg border border-border/60 bg-muted/20">
          <p className="text-muted-foreground text-[11px]">Идентификатор пользователя</p>
          <p className="font-mono text-[11px] text-foreground truncate select-all">{user.id}</p>
        </div>

        <div className="space-y-1 p-3 rounded-lg border border-border/60 bg-muted/20">
          <p className="text-muted-foreground text-[11px]">Статус учетной записи</p>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">Активна</span>
          </div>
        </div>

        {formattedDate && (
          <div className="space-y-1 p-3 rounded-lg border border-border/60 bg-muted/20 sm:col-span-2">
            <p className="text-muted-foreground text-[11px]">Дата регистрации</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ActiveSessionCard({ user }: { user: User }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      const { refreshToken } = getStoredTokens()
      if (refreshToken) {
        await logoutMutation({ refresh_token: refreshToken }).unwrap()
      }
    } catch {
      // Ignored
    } finally {
      dispatch(clientLogout())
      dispatch(baseApi.util.resetApiState())
      try {
        await serverLogout()
      } catch {
        // Ignore NEXT_REDIRECT
      }
      window.location.href = "/login"
    }
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-card p-6 shadow-xs sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-destructive">
            Завершить сеанс
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Выход из текущей учетной записи ({user.email}) на этом устройстве
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          disabled={isLoggingOut}
          onClick={handleLogout}
          className="h-9 gap-1.5 text-xs font-medium cursor-pointer shrink-0"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Выход...</span>
            </>
          ) : (
            <>
              <LogOut className="size-3.5" />
              <span>Выйти из аккаунта</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = React.useState<"general" | "security">(
    tabParam === "security" ? "security" : "general"
  )

  React.useEffect(() => {
    if (tabParam === "security") {
      setActiveTab("security")
    } else if (tabParam === "general") {
      setActiveTab("general")
    }
  }, [tabParam])

  const handleTabChange = (tab: "general" | "security") => {
    setActiveTab(tab)
    router.replace(`/profile?tab=${tab}`, { scroll: false })
  }

  const { data: user, isLoading: isUserLoading } = useGetMeQuery()

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl 2xl:max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Назад</span>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Настройки профиля
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Управление личными данными, учетной записью и безопасностью
          </p>
        </div>

        <div className="flex border-b border-border/80 gap-1 pb-px">
          <button
            type="button"
            onClick={() => handleTabChange("general")}
            className={cn(
              "relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer",
              activeTab === "general"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <UserIcon className="size-3.5" />
            <span>Личные данные</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("security")}
            className={cn(
              "relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer",
              activeTab === "security"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <KeyRound className="size-3.5" />
            <span>Безопасность и пароль</span>
          </button>
        </div>

        {/* Tab 1: General Profile */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <ProfileInfoCard key={user.id} user={user} />
            <AccountOverviewCard user={user} />
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <ChangePasswordCard />
            <ActiveSessionCard user={user} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProfileContent />
    </React.Suspense>
  )
}
