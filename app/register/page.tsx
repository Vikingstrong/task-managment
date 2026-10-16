"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, ChevronDown, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRegisterMutation } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialToken = searchParams.get("invite_token") || ""

  const [showPassword, setShowPassword] = React.useState(false)
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [inviteToken, setInviteToken] = React.useState(initialToken)
  const [showInviteField, setShowInviteField] = React.useState(!!initialToken)
  const [agreeTerms, setAgreeTerms] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [register, { isLoading }] = useRegisterMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password.length < 8) {
      setErrorMessage("Пароль должен содержать не менее 8 символов.")
      return
    }

    try {
      await register({
        email,
        password,
        display_name: displayName,
        invite_token: inviteToken.trim() || undefined,
      }).unwrap()

      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/"
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="w-full max-w-95">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Регистрация
          </h1>
          <p className="text-sm text-muted-foreground">
            Создайте учетную запись для работы
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Имя</Label>
            <Input
              id="display_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Пароль</Label>
              <span className="text-[11px] text-muted-foreground">
                Мин. 8 символов
              </span>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Optional Invite Token */}
          <div className="pt-0.5">
            {!showInviteField ? (
              <button
                type="button"
                onClick={() => setShowInviteField(true)}
                disabled={isLoading}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <span>Есть код приглашения?</span>
                <ChevronDown className="size-3" />
              </button>
            ) : (
              <div className="space-y-1.5 rounded-md border border-border bg-muted/40 p-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="invite_token" className="text-xs">
                    Код приглашения
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteField(false)
                      setInviteToken("")
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
                <Input
                  id="invite_token"
                  type="text"
                  placeholder="Invite token"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  disabled={isLoading}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="pt-0.5">
            <label className="flex cursor-pointer items-start gap-2 select-none">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 size-4 rounded border-border accent-foreground transition"
              />
              <span className="text-xs text-muted-foreground leading-tight">
                Согласен с правилами сервиса
              </span>
            </label>
          </div>

          {/* Clean inline error message */}
          {errorMessage && (
            <p className="text-xs text-destructive font-medium tracking-tight">
              {errorMessage}
            </p>
          )}

          {/* Primary Action Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full h-10 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Регистрация...</span>
              </div>
            ) : (
              "Зарегистрироваться"
            )}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center px-4 py-8">
      <Suspense
        fallback={
          <div className="w-full max-w-95 p-8 text-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin mx-auto text-foreground" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  )
}
