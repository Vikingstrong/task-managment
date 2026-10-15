"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useChangePasswordMutation } from "@/redux/api/authApi"
import { useAppDispatch } from "@/redux/hooks"
import { logout as clientLogout } from "@/redux/features/authSlice"
import { logout as serverLogout } from "@/actions/auth"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { cn } from "@/lib/utils"

export function ChangePasswordCard() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [changePassword, { isLoading }] = useChangePasswordMutation()

  // Real-time validation checks
  const isMinLength = newPassword.length >= 8
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword
  const isDifferent = currentPassword.length > 0 && newPassword.length > 0 && currentPassword !== newPassword

  const handleManualLogout = async () => {
    dispatch(clientLogout())
    await serverLogout()
    router.push("/login")
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!currentPassword) {
      setError("Укажите текущий пароль")
      return
    }

    if (newPassword.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Новые пароли не совпадают")
      return
    }

    if (currentPassword === newPassword) {
      setError("Новый пароль должен отличаться от текущего")
      return
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap()

      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground shrink-0">
          <KeyRound className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Смена пароля
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Обновите пароль для защиты учетной записи. Минимальная длина — 8 символов.
          </p>
        </div>
      </div>

      {/* Information Banner - User-friendly */}
      <div className="mb-6 rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
        <Info className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          После смены пароля потребуется повторно войти в аккаунт на всех устройствах.
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-foreground mt-0.5" />
            <div>
              <p className="font-medium text-xs text-foreground">Пароль успешно изменен</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Все предыдущие сеансы завершены. Вы можете заново войти в аккаунт с новым паролем.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleManualLogout}
              className="h-8 px-3 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium cursor-pointer"
            >
              <LogOut className="size-3.5 mr-1.5" />
              <span>Войти с новым паролем</span>
            </Button>
          </div>
        </div>
      )}

      {/* Password Change Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1.5">
          <Label htmlFor="current_password" className="text-xs sm:text-sm font-medium">
            Текущий пароль
          </Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="h-10 pr-10 text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1"
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="new_password" className="text-xs sm:text-sm font-medium">
              Новый пароль
            </Label>
            <span className="text-[11px] text-muted-foreground">Минимум 8 символов</span>
          </div>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="h-10 pr-10 text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1"
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-xs sm:text-sm font-medium">
            Подтверждение нового пароля
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="h-10 pr-10 text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1"
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Requirements live feedback badges */}
        {newPassword.length > 0 && (
          <div className="rounded-md border border-border/50 bg-muted/20 p-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-3.5 items-center justify-center rounded-full text-[9px]",
                  isMinLength
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isMinLength ? <Check className="size-2.5 stroke-[3]" /> : "•"}
              </span>
              <span className={cn(isMinLength ? "text-foreground font-medium" : "text-muted-foreground")}>
                Длина не менее 8 символов
              </span>
            </div>

            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded-full text-[9px]",
                    isMatching
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/20 text-destructive"
                  )}
                >
                  {isMatching ? <Check className="size-2.5 stroke-[3]" /> : "✕"}
                </span>
                <span className={cn(isMatching ? "text-foreground font-medium" : "text-destructive font-medium")}>
                  {isMatching ? "Пароли совпадают" : "Пароли не совпадают"}
                </span>
              </div>
            )}

            {currentPassword.length > 0 && newPassword.length > 0 && !isDifferent && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="size-3" />
                <span>Новый пароль должен отличаться от текущего</span>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-destructive font-medium tracking-tight">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading || (newPassword.length > 0 && (!isMinLength || !isMatching))}
            className="h-9 px-4 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors text-xs cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Смена пароля...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5" />
                <span>Обновить пароль</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
