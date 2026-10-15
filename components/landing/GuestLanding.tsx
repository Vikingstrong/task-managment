"use client"

import * as React from "react"
import Link from "next/link"
import {
  AppWindow,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react"

import HeroCTA from "@/components/widget/HeroCTA"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MockTask {
  id: string
  key: string
  title: string
  description: string
  state: "backlog" | "unstarted" | "started" | "completed"
  stateName: string
  stateColor: string
  priority: "urgent" | "high" | "medium" | "low"
  priorityLabel: string
  priorityColor: string
  tag: string
  assigneeName?: string
  assigneeInitial?: string
}

const MOCK_TASKS: MockTask[] = [
  {
    id: "1",
    key: "CORE-101",
    title: "Реализовать ротацию JWT и фоновое обновление сессий",
    description: "Автоматический перехват 401 и обновление токенов через RTK Query",
    state: "completed",
    stateName: "Готово",
    stateColor: "#22c55e",
    priority: "urgent",
    priorityLabel: "Срочный",
    priorityColor: "text-red-500 bg-red-500/10 border-red-500/20",
    tag: "Безопасность",
    assigneeName: "Алексей И.",
    assigneeInitial: "А",
  },
  {
    id: "2",
    key: "CORE-102",
    title: "Интерактивная Канбан-доска с кастомным воркфлоу",
    description: "Мгновенное перемещение задач и распределение по колонкам",
    state: "started",
    stateName: "В работе",
    stateColor: "#eab308",
    priority: "high",
    priorityLabel: "Высокий",
    priorityColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    tag: "Frontend",
    assigneeName: "Дмитрий К.",
    assigneeInitial: "Д",
  },
  {
    id: "3",
    key: "CORE-103",
    title: "Оконная система MacModal с анимациями macOS",
    description: "Интерактивные точки: закрытие с блюром, сжатие и полноэкранный режим",
    state: "started",
    stateName: "В работе",
    stateColor: "#eab308",
    priority: "medium",
    priorityLabel: "Средний",
    priorityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    tag: "UI / UX",
    assigneeName: "Елена С.",
    assigneeInitial: "Е",
  },
  {
    id: "4",
    key: "CORE-104",
    title: "Мультиарендные рабочие пространства и роли",
    description: "Изоляция проектов, управление правами (Owner, Admin, Member, Guest)",
    state: "unstarted",
    stateName: "К выполнению",
    stateColor: "#3b82f6",
    priority: "high",
    priorityLabel: "Высокий",
    priorityColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    tag: "Архитектура",
    assigneeName: "Михаил В.",
    assigneeInitial: "М",
  },
  {
    id: "5",
    key: "CORE-105",
    title: "Табличный список задач высокой плотности",
    description: "Быстрый триаж бэклога со сменой статусов в выпадающем меню",
    state: "unstarted",
    stateName: "К выполнению",
    stateColor: "#3b82f6",
    priority: "medium",
    priorityLabel: "Средний",
    priorityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    tag: "Frontend",
    assigneeName: "Анна П.",
    assigneeInitial: "А",
  },
  {
    id: "6",
    key: "CORE-106",
    title: "Интеграция прямого S3-хранилища для вложений",
    description: "Загрузка файлов по предподписанным ссылкам без нагрузки на сервер",
    state: "backlog",
    stateName: "Бэклог",
    stateColor: "#737373",
    priority: "low",
    priorityLabel: "Низкий",
    priorityColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    tag: "DevOps",
  },
]

export default function GuestLanding() {
  const [activeTab, setActiveTab] = React.useState<"board" | "list">("board")
  const [filterMode, setFilterMode] = React.useState<"all" | "active">("all")
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [windowEffect, setWindowEffect] = React.useState<"none" | "squeeze" | "blur">("none")

  const filteredTasks = React.useMemo(() => {
    if (filterMode === "active") {
      return MOCK_TASKS.filter((t) => t.state !== "completed")
    }
    return MOCK_TASKS
  }, [filterMode])

  const handleTrafficDotClick = (dot: "red" | "yellow" | "green") => {
    if (dot === "green") {
      setIsMaximized((prev) => !prev)
    } else if (dot === "yellow") {
      setWindowEffect("squeeze")
      setTimeout(() => setWindowEffect("none"), 800)
    } else if (dot === "red") {
      setWindowEffect("blur")
      setTimeout(() => setWindowEffect("none"), 800)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-start min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 overflow-x-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-350 space-y-16 sm:space-y-24">
        
        <div className="flex flex-col items-center text-center space-y-5 max-w-3xl mx-auto pt-2 sm:pt-4">
         

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
            Управление задачами и проектами со скоростью мысли
          </h1>

          {/* Subtitle matching reality */}
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal">
            Изолированные рабочие пространства, настраиваемые жизненные циклы разработки, интерактивная Канбан-доска и структурированный список задач в стиле Linear.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <HeroCTA />
          </div>

        </div>

        {/* ================= INTERACTIVE PRODUCT SHOWCASE ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground/80">
                Интерактивное превью
              </span>
              <span>·</span>
              <span className="hidden sm:inline">Переключайте вкладки и фильтры, чтобы оценить скорость</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground font-medium">Live Demo</span>
            </div>
          </div>

          {/* macOS Window Frame */}
          <div
            className={cn(
              "rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-300",
              isMaximized ? "max-w-full" : "max-w-[1360px] mx-auto",
              windowEffect === "squeeze" && "scale-95 opacity-80",
              windowEffect === "blur" && "scale-95 blur-xs opacity-75"
            )}
          >
            {/* macOS Window Titlebar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 select-none">
              <div className="flex items-center gap-3">
                {/* Traffic Light Controls with Tooltips */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTrafficDotClick("red")}
                    title="Красная точка: закрытие с размытием (кликните для теста)"
                    className="size-3 rounded-full bg-[#ff5f56] hover:brightness-90 transition-transform hover:scale-110 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleTrafficDotClick("yellow")}
                    title="Желтая точка: анимация сжатия (кликните для теста)"
                    className="size-3 rounded-full bg-[#ffbd2e] hover:brightness-90 transition-transform hover:scale-110 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleTrafficDotClick("green")}
                    title="Зеленая точка: переключить ширину окна (кликните для теста)"
                    className="size-3 rounded-full bg-[#27c93f] hover:brightness-90 transition-transform hover:scale-110 cursor-pointer"
                  />
                </div>

                <div className="h-3.5 w-px bg-border/80" />

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-muted/60 text-foreground">
                    CORE
                  </span>
                  <span className="font-semibold text-foreground tracking-tight">
                    TaskFlow Core
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">· Воркфлоу проекта</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span className="hidden md:inline rounded bg-muted/60 px-2 py-0.5 text-[11px]">
                  Next.js 16 · Turbopack
                </span>
                <span className="text-emerald-500 font-medium">6 задач в проекте</span>
              </div>
            </div>

            {/* In-Mockup Toolbar: Tabs & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 sm:px-6 py-2.5">
              {/* Tab Switcher: Kanban vs Task List */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("board")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "board"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Канбан-доска</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "list"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Список задач</span>
                </button>
              </div>

              {/* Toolbar Actions: Filter Mode & Search Mock */}
              <div className="flex items-center gap-2.5">
                <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      filterMode === "all"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Все ({MOCK_TASKS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("active")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      filterMode === "active"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    В работе ({MOCK_TASKS.filter((t) => t.state !== "completed").length})
                  </button>
                </div>

                <div className="relative hidden md:block w-48">
                  <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    disabled
                    placeholder="Поиск задач..."
                    className="h-7 w-full rounded-md border border-input bg-card pl-7 pr-2 text-[11px] outline-hidden text-muted-foreground cursor-default"
                  />
                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span className="hidden sm:inline">Создать задачу</span>
                </Link>
              </div>
            </div>

            {/* Window Content: Kanban Board View or List View */}
            <div className="p-4 sm:p-6 bg-background/30 min-h-[460px]">
              {activeTab === "board" ? (
                /* ================= KANBAN VIEW MOCKUP ================= */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Column 1: Бэклог */}
                  <div className="flex flex-col rounded-xl border border-border bg-card/40 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#737373]" />
                        <span className="text-xs font-semibold text-foreground">Бэклог</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "backlog").length}
                        </span>
                      </div>
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="p-2.5 space-y-2.5">
                      {filteredTasks
                        .filter((t) => t.state === "backlog")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-foreground/30 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                {task.key}
                              </span>
                              <span
                                className={`text-[10px] font-medium border px-1.5 py-0.2 rounded-sm ${task.priorityColor}`}
                              >
                                {task.priorityLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
                              <span className="rounded bg-muted/50 px-1.5 py-0.5 border border-border/40">
                                {task.tag}
                              </span>
                              <span>Не назначен</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 2: К выполнению */}
                  <div className="flex flex-col rounded-xl border border-border bg-card/40 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#3b82f6]" />
                        <span className="text-xs font-semibold text-foreground">К выполнению</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "unstarted").length}
                        </span>
                      </div>
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="p-2.5 space-y-2.5">
                      {filteredTasks
                        .filter((t) => t.state === "unstarted")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-foreground/30 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                {task.key}
                              </span>
                              <span
                                className={`text-[10px] font-medium border px-1.5 py-0.2 rounded-sm ${task.priorityColor}`}
                              >
                                {task.priorityLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {task.title}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <span className="text-[10px] font-mono text-muted-foreground rounded bg-muted/50 px-1.5 py-0.5 border border-border/40">
                                {task.tag}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold uppercase">
                                  {task.assigneeInitial}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {task.assigneeName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 3: В работе */}
                  <div className="flex flex-col rounded-xl border border-border bg-card/40 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#eab308]" />
                        <span className="text-xs font-semibold text-foreground">В работе</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "started").length}
                        </span>
                      </div>
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="p-2.5 space-y-2.5">
                      {filteredTasks
                        .filter((t) => t.state === "started")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-foreground/30 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                {task.key}
                              </span>
                              <span
                                className={`text-[10px] font-medium border px-1.5 py-0.2 rounded-sm ${task.priorityColor}`}
                              >
                                {task.priorityLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <span className="text-[10px] font-mono text-muted-foreground rounded bg-muted/50 px-1.5 py-0.5 border border-border/40">
                                {task.tag}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[9px] font-bold uppercase">
                                  {task.assigneeInitial}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {task.assigneeName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 4: Готово */}
                  <div className="flex flex-col rounded-xl border border-border bg-card/40 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#22c55e]" />
                        <span className="text-xs font-semibold text-foreground">Готово</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "completed").length}
                        </span>
                      </div>
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="p-2.5 space-y-2.5">
                      {filteredTasks
                        .filter((t) => t.state === "completed")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-foreground/30 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                {task.key}
                              </span>
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                            </div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                              {task.title}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <span className="text-[10px] font-mono text-muted-foreground rounded bg-muted/50 px-1.5 py-0.5 border border-border/40">
                                {task.tag}
                              </span>
                              <span className="text-[11px] text-emerald-500 font-medium">
                                Выполнено
                              </span>
                            </div>
                          </div>
                        ))}
                      {filteredTasks.filter((t) => t.state === "completed").length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground/60">
                          Задачи скрыты фильтром &laquo;В работе&raquo;
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ================= TASK LIST VIEW MOCKUP ================= */
                <div className="space-y-4">
                  {/* Group 1: Started */}
                  <div className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#eab308]" />
                        <span className="text-xs font-semibold text-foreground">В работе</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "started").length}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Активная разработка</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {filteredTasks
                        .filter((t) => t.state === "started")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border/70 bg-card/60 hover:bg-card transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                                {task.key}
                              </span>
                              <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-border/60 bg-muted/30 shrink-0">
                                <div className="size-2 rounded-full bg-[#eab308]" />
                                <span className="text-[11px] text-foreground font-medium">В работе</span>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <span
                                className={`text-[10px] font-medium border px-2 py-0.5 rounded-sm shrink-0 ${task.priorityColor}`}
                              >
                                {task.priorityLabel}
                              </span>
                              <div className="w-28 flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-foreground">
                                <div className="size-3.5 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[8px] font-bold uppercase shrink-0">
                                  {task.assigneeInitial}
                                </div>
                                <span className="text-[10px] font-medium truncate">
                                  {task.assigneeName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Group 2: Unstarted */}
                  <div className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#3b82f6]" />
                        <span className="text-xs font-semibold text-foreground">К выполнению</span>
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {filteredTasks.filter((t) => t.state === "unstarted").length}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Запланировано</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {filteredTasks
                        .filter((t) => t.state === "unstarted")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border/70 bg-card/60 hover:bg-card transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                                {task.key}
                              </span>
                              <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-border/60 bg-muted/30 shrink-0">
                                <div className="size-2 rounded-full bg-[#3b82f6]" />
                                <span className="text-[11px] text-foreground font-medium">К выполнению</span>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {task.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <span
                                className={`text-[10px] font-medium border px-2 py-0.5 rounded-sm shrink-0 ${task.priorityColor}`}
                              >
                                {task.priorityLabel}
                              </span>
                              <div className="w-28 flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-foreground">
                                <div className="size-3.5 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[8px] font-bold uppercase shrink-0">
                                  {task.assigneeInitial}
                                </div>
                                <span className="text-[10px] font-medium truncate">
                                  {task.assigneeName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Group 3: Completed */}
                  {filteredTasks.some((t) => t.state === "completed") && (
                    <div className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-2xs">
                      <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-[#22c55e]" />
                          <span className="text-xs font-semibold text-foreground">Готово</span>
                          <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                            {filteredTasks.filter((t) => t.state === "completed").length}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">Завершенные задачи</span>
                      </div>
                      <div className="p-2 space-y-1.5">
                        {filteredTasks
                          .filter((t) => t.state === "completed")
                          .map((task) => (
                            <div
                              key={task.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border/70 bg-card/60 hover:bg-card transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                                  {task.key}
                                </span>
                                <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-border/60 bg-muted/30 shrink-0">
                                  <div className="size-2 rounded-full bg-[#22c55e]" />
                                  <span className="text-[11px] text-foreground font-medium">Готово</span>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                  {task.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                <span
                                  className={`text-[10px] font-medium border px-2 py-0.5 rounded-sm shrink-0 ${task.priorityColor}`}
                                >
                                  {task.priorityLabel}
                                </span>
                                <div className="w-28 flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-foreground">
                                  <div className="size-3.5 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-mono text-[8px] font-bold uppercase shrink-0">
                                    {task.assigneeInitial}
                                  </div>
                                  <span className="text-[10px] font-medium truncate">
                                    {task.assigneeName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 6 CORE PRODUCT PILLARS ================= */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Все возможности для вашей команды
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Построено инженерами для инженеров. Высокая скорость работы и внимание к деталям.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <LayoutGrid className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Мультиарендные пространства
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Изолированные рабочие пространства с собственным URL-слагом (<code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">/team</code>), проектами, ролями участников (Owner, Admin, Member, Guest) и быстрым переключением в шапке.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <Layers className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Кастомные воркфлоу проекта
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Настраиваемые жизненные циклы разработки: фазы Backlog, Unstarted, Started, Completed и Cancelled с собственными HEX-цветами, сортировкой колонок и статусами по умолчанию.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <SlidersHorizontal className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Канбан и Список задач
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Два мощных режима работы: наглядные колонки для визуализации рабочего процесса и сверхплотный табличный список для быстрого триажа, поиска и сортировки бэклога.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <Sparkles className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Приоритеты и сквозные ключи
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Уникальные проектные идентификаторы (<code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">PRJ-42</code>), цветовой триаж приоритетов (Urgent, High, Medium, Low, None) и привязка исполнителей с аватарами.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <AppWindow className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                macOS Оконный интерфейс
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Фирменные модальные окна MacModal: интерактивные точки управления, плавное закрытие с блюром, сжатие при сворачивании и переключение в полноэкранный режим.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-2xs hover:border-foreground/30 transition-colors">
              <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-foreground">
                <ShieldCheck className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                JWT Ротация и безопасность
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Надежная авторизация с автоматической фоновой ротацией токенов через RTK Query, поддержка защищенных cookie и моментальный отклик интерфейса.
              </p>
            </div>
          </div>
        </div>

        {/* ================= LIFECYCLE PHASES WALKTHROUGH ================= */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Стандартный жизненный цикл задачи
            </h2>
            <p className="text-xs text-muted-foreground">
              Каждая задача проходит прозрачные этапы от идеи до релиза.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Step 1: Backlog */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-[#737373]" />
                <span className="text-xs font-semibold text-foreground">1. Бэклог</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Фиксация идей, требований и технических долгов команды.
              </p>
            </div>

            {/* Step 2: Unstarted */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Circle className="size-3 text-[#3b82f6]" />
                <span className="text-xs font-semibold text-foreground">2. К выполнению</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Оцененные задачи с назначенными исполнителями и приоритетом.
              </p>
            </div>

            {/* Step 3: Started */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-[#eab308]" />
                <span className="text-xs font-semibold text-foreground">3. В работе</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Активная разработка и реализация функциональности.
              </p>
            </div>

            {/* Step 4: Review / Started */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-purple-500" />
                <span className="text-xs font-semibold text-foreground">4. На ревью</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Проверка кода, кросс-ревью и подтверждение качества.
              </p>
            </div>

            {/* Step 5: Completed */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3 text-[#22c55e]" />
                <span className="text-xs font-semibold text-foreground">5. Готово</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Успешно закрытые задачи, готовые к поставке в релиз.
              </p>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-muted/30 p-8 sm:p-12 text-center space-y-5 shadow-lg max-w-3xl mx-auto">
          <div className="size-10 rounded-xl border border-border bg-muted/40 flex items-center justify-center mx-auto text-foreground shadow-2xs">
            <Zap className="size-5" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Готовы упорядочить разработку вашей команды?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Создайте своё первое рабочее пространство за 30 секунд. Без громоздких настроек и перегруженных интерфейсов.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "default" }),
                "bg-foreground text-background hover:bg-foreground/90 font-medium px-6 h-10 gap-2 cursor-pointer"
              )}
            >
              <span>Создать аккаунт</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "h-10 px-6 text-foreground cursor-pointer"
              )}
            >
              Войти
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
