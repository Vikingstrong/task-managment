"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/redux/hooks"

export default function HeroCTA() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (isAuthenticated) {
    return (
      <Link
        href="/profile"
        className={cn(
          buttonVariants({ size: "default" }),
          "bg-foreground text-background hover:bg-foreground/90 font-medium px-5 h-10 gap-1.5"
        )}
      >
        <span>Перейти в профиль</span>
        <ArrowRight className="size-4" />
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/register"
        className={cn(
          buttonVariants({ size: "default" }),
          "bg-foreground text-background hover:bg-foreground/90 font-medium px-5 h-10 gap-1.5"
        )}
      >
        <span>Начать работу</span>
        <ArrowRight className="size-4" />
      </Link>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "h-10 px-5 text-foreground"
        )}
      >
        Войти
      </Link>
    </>
  )
}
