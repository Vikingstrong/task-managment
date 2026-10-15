"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, CheckSquare, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectNavTabsProps {
  workspaceSlug: string
  projectId: string
}

export function ProjectNavTabs({ workspaceSlug, projectId }: ProjectNavTabsProps) {
  const pathname = usePathname()
  const basePath = `/${workspaceSlug}/${projectId}`

  const isTasksActive = pathname === basePath
  const isCyclesActive = pathname.startsWith(`${basePath}/cycles`)
  const isModulesActive = pathname.startsWith(`${basePath}/modules`)

  const tabs = [
    {
      label: "Задачи",
      href: basePath,
      isActive: isTasksActive,
      icon: CheckSquare,
    },
    {
      label: "Спринты",
      href: `${basePath}/cycles`,
      isActive: isCyclesActive,
      icon: RotateCw,
    },
    {
      label: "Модули",
      href: `${basePath}/modules`,
      isActive: isModulesActive,
      icon: Boxes,
    },
  ]

  return (
    <div className="flex border-b border-border bg-muted/20 px-4 sm:px-6 py-2 gap-1.5 text-xs font-medium overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer",
              tab.isActive
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
