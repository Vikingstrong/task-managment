"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useLoginMutation } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    try {
      await login({ email, password }).unwrap()
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Header */}
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Вход
            </h1>
            <p className="text-sm text-muted-foreground">
              Введите данные учетной записи
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Link
                  href="#"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Забыли?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-border accent-foreground transition"
                  disabled={isLoading}
                />
                <span className="text-xs text-muted-foreground">
                  Запомнить меня
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
              className="mt-2 w-full h-10 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Вход...</span>
                </div>
              ) : (
                "Войти"
              )}
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
