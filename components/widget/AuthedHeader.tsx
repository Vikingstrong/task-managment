"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  KeyRound,
  LayoutGrid,
  LogOut,
  Plus,
  User as UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { logout as serverLogout } from "@/actions/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/themes/ModeToggle"
import { baseApi } from "@/redux/api/baseApi"
import { useGetMeQuery, useLogoutMutation } from "@/redux/api/authApi"
import { useGetWorkspacesQuery } from "@/redux/api/workspaceApi"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { logout as clientLogout } from "@/redux/features/authSlice"
import { getStoredTokens } from "@/lib/auth/cookies"
import { CreateWorkspaceModal } from "@/components/workspaces/CreateWorkspaceModal"
import { NotificationCenter } from "@/components/widget/NotificationCenter"

export default function AuthedHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  // 1. Get user profile
  const { data: remoteUser } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const localUser = useAppSelector((state) => state.auth.user)
  const user = remoteUser || localUser || {
    id: "",
    email: "",
    display_name: "Пользователь",
    avatar_url: null,
  }

  // 2. Get workspaces
  const { data: workspaces = [] } = useGetWorkspacesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  // 3. Determine if currently inside an active workspace
  const pathSegments = pathname.split("/").filter(Boolean)
  const currentSlug = pathSegments[0]
  const activeWorkspace = workspaces.find((w) => w.slug === currentSlug)
  const isAtAllWorkspaces = !activeWorkspace

  // Only show "Проекты" tab if user is currently inside an active workspace
  const navLinks = activeWorkspace
    ? [
        { label: "Проекты", href: `/${activeWorkspace.slug}` },
      ]
    : []

  const [logoutMutation] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      const { refreshToken } = getStoredTokens()
      if (refreshToken) {
        await logoutMutation({ refresh_token: refreshToken }).unwrap()
      }
    } catch {
      // Ignore network logout errors
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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md select-none">
        <div className="mx-auto flex h-14 w-full max-w-365 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5 sm:gap-6">
            <Link
              href="/"
              className="text-base sm:text-lg font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              TaskFlow
            </Link>

            {/* Workspace Selector Dropdown with macOS Dots UI */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs sm:text-sm font-medium outline-hidden hover:bg-muted/60 transition-colors cursor-pointer max-w-[220px] sm:max-w-[320px]">
                {activeWorkspace ? (
                  <>
                    <div className="size-4.5 rounded-sm bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[10px] font-bold uppercase shrink-0">
                      {activeWorkspace.name.charAt(0)}
                    </div>
                    <span className="font-medium truncate text-foreground text-xs sm:text-sm">
                      {activeWorkspace.name}
                    </span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground truncate text-xs sm:text-sm">
                      Все пространства
                    </span>
                  </>
                )}
                <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 ml-auto" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-64 sm:w-72 p-2">
                {/* Option 1: All Workspaces */}
                <DropdownMenuItem
                  onClick={() => router.push("/")}
                  className="cursor-pointer text-xs sm:text-sm flex items-center justify-between rounded-md py-2 px-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="size-4 text-muted-foreground" />
                    <span className={cn(isAtAllWorkspaces && "font-semibold text-foreground")}>
                      Все пространства
                    </span>
                  </div>
                  {isAtAllWorkspaces && (
                    <span className="size-2 rounded-full bg-[#007aff]" title="Текущее окно" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                  Ваши пространства ({workspaces.length})
                </DropdownMenuLabel>

                {workspaces.map((w) => {
                  const isActive = w.slug === activeWorkspace?.slug

                  return (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => router.push(`/${w.slug}`)}
                      className="cursor-pointer text-xs sm:text-sm flex items-center justify-between rounded-md py-2 px-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-4.5 rounded-sm bg-muted border border-border flex items-center justify-center font-mono text-[10px] font-bold uppercase shrink-0">
                          {w.name.charAt(0)}
                        </div>
                        <span className={cn("truncate", isActive && "font-semibold text-foreground")}>
                          {w.name}
                        </span>
                      </div>
                      {isActive && (
                        <span className="size-2 rounded-full bg-[#007aff]" title="Активное пространство" />
                      )}
                    </DropdownMenuItem>
                  )
                })}

                <DropdownMenuSeparator className="my-1.5" />

                {/* Option: Create Workspace Modal Trigger */}
                <DropdownMenuItem
                  onClick={() => setIsCreateOpen(true)}
                  className="cursor-pointer text-xs sm:text-sm flex items-center justify-between rounded-md py-2 px-2.5 text-foreground font-medium"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="size-4 text-foreground" />
                    <span>Создать пространство</span>
                  </div>
                  <span className="size-2 rounded-full bg-[#27c93f]" title="Создать" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Navigation Links: ONLY visible if active workspace exists */}
            {navLinks.length > 0 && (
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-muted/80 hover:text-foreground",
                      pathname === link.href || pathname.startsWith(`${link.href}/`)
                        ? "bg-muted text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            <ModeToggle />

            {activeWorkspace && (
              <NotificationCenter workspaceSlug={activeWorkspace.slug} />
            )}

            {/* User Profile Menu with macOS Dots UI */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 outline-hidden hover:bg-muted cursor-pointer transition-colors">
                <Avatar className="h-8 w-8 border border-border">
                  {user.avatar_url && (
                    <AvatarImage src={user.avatar_url} alt={user.display_name} />
                  )}
                  <AvatarFallback className="text-xs font-medium">
                    {user.display_name ? user.display_name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs sm:text-sm font-medium sm:inline max-w-[140px] truncate text-foreground">
                  {user.display_name}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.display_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer text-xs flex items-center gap-2 rounded-md py-1.5 px-2"
                >
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  <span>Профиль</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/profile?tab=security")}
                  className="cursor-pointer text-xs flex items-center gap-2 rounded-md py-1.5 px-2"
                >
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  <span>Безопасность и пароль</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="cursor-pointer text-xs flex items-center gap-2 rounded-md py-1.5 px-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Global Workspace Creation Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => router.push(`/${created.slug}`)}
      />
    </>
  )
}