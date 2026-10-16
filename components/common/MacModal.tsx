"use client"

import * as React from "react"
import { Maximize2, Minimize2, Minus, X } from "lucide-react"

export interface MacModalProps {
  id?: string
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  tag?: string
  defaultWidth?: string
  maximizedWidth?: string
  children: React.ReactNode
}

/**
 * Authentic macOS Modal with realistic window chrome:
 * - Red dot (#ff5f56): Closes with a smooth scale-down & blur animation
 * - Yellow dot (#ffbd2e): Closes with a distinct squeeze (compression) animation
 * - Green dot (#27c93f): Toggles expanded / maximized width
 * - Touch friendly: Larger size & visible glyphs on mobile/tablet screens for finger tap precision
 * - Responsive scroll container: Automatically bounds height to viewport (dvh) so large modals
 *   never exceed screen bounds, keep the titlebar pinned, and allow smooth internal vertical scrolling.
 */
export function MacModal({
  isOpen,
  onClose,
  title,
  subtitle,
  tag,
  defaultWidth = "max-w-2xl sm:max-w-3xl",
  maximizedWidth = "max-w-5xl",
  children,
}: MacModalProps) {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [closeAnimation, setCloseAnimation] = React.useState<"none" | "red" | "yellow">("none")

  // Reset animation and maximization when opened
  React.useEffect(() => {
    if (isOpen) {
      setCloseAnimation("none")
    }
  }, [isOpen])

  // Prevent background body scroll while modal is active
  React.useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Handle Red dot: smooth scale-down + blur fade
  const handleRedClose = () => {
    if (closeAnimation !== "none") return
    setCloseAnimation("red")
    setTimeout(() => {
      setCloseAnimation("none")
      onClose()
    }, 180)
  }

  // Handle Yellow dot: squeeze (horizontal & vertical compression)
  const handleYellowClose = () => {
    if (closeAnimation !== "none") return
    setCloseAnimation("yellow")
    setTimeout(() => {
      setCloseAnimation("none")
      onClose()
    }, 240)
  }

  // Handle Esc key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && closeAnimation === "none") {
        handleRedClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeAnimation])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 sm:p-6 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
      onClick={handleRedClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isMaximized ? maximizedWidth : defaultWidth
        } max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          closeAnimation === "red"
            ? "scale-95 opacity-0 blur-sm duration-180"
            : closeAnimation === "yellow"
              ? "scale-x-25 scale-y-10 translate-y-24 opacity-0 blur-xs duration-240"
              : "scale-100 opacity-100 translate-y-0"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* macOS Window Titlebar (pinned at the top) */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5 select-none">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Traffic Lights - Larger and touch-friendly on mobile/tablet */}
            <div className="group/traffic flex items-center gap-2.5 sm:gap-2 shrink-0">
              {/* Close (Red - Scale & Blur close) */}
              <button
                type="button"
                onClick={handleRedClose}
                title="Закрыть окно (Esc)"
                aria-label="Закрыть"
                className="size-4 sm:size-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-hidden touch-manipulation shadow-xs"
              >
                <X className="size-2.5 sm:size-2 text-[#4c0002] opacity-100 sm:opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
              </button>

              {/* Squeeze Close (Yellow - Squeeze compression close) */}
              <button
                type="button"
                onClick={handleYellowClose}
                title="Сжать и закрыть окно"
                aria-label="Сжать и закрыть"
                className="size-4 sm:size-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-hidden touch-manipulation shadow-xs"
              >
                <Minus className="size-2.5 sm:size-2 text-[#573900] opacity-100 sm:opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
              </button>

              {/* Maximize (Green - Toggle width) */}
              <button
                type="button"
                onClick={() => setIsMaximized((prev) => !prev)}
                title={isMaximized ? "Свернуть в стандартный размер" : "Развернуть на весь экран"}
                aria-label="Изменить размер"
                className="size-4 sm:size-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-hidden touch-manipulation shadow-xs"
              >
                {isMaximized ? (
                  <Minimize2 className="size-2.5 sm:size-2 text-[#004e14] opacity-100 sm:opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
                ) : (
                  <Maximize2 className="size-2.5 sm:size-2 text-[#004e14] opacity-100 sm:opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
                )}
              </button>
            </div>

            {/* Window Title & Tag */}
            <div className="flex items-center gap-2.5 min-w-0">
              {tag && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border bg-muted/60 text-foreground shrink-0 tracking-wide">
                  {tag}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-foreground truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Close Button for mobile */}
          <button
            type="button"
            onClick={handleRedClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors sm:hidden"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
