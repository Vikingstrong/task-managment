import Link from "next/link"
import { cookies } from "next/headers"

import { buttonVariants } from "@/components/ui/button"
import { ModeToggle } from "@/components/themes/ModeToggle"
import AuthedHeader from "@/components/widget/AuthedHeader"


export default async function Header() {
  const store = await cookies()
  const isAuth = store.has("access_token") || store.has("refresh_token")

  if (isAuth) {
    return <AuthedHeader />
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight">
          TaskFlow
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Войти
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Регистрация
          </Link>
        </div>
      </div>
    </header>
  )
}