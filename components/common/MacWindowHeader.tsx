"use client"

import * as React from "react"
import { Maximize2, Minimize2, Minus, X } from "lucide-react"

export interface MacWindowHeaderProps {
  title: string
  subtitle?: string
  tag?: string
  onClose?: () => void
  onReset?: () => void
  isMaximized?: boolean
  onToggleMaximize?: () => void
  className?: string
  children?: React.ReactNode
}

/**
 * Authentic macOS Window Chrome with functional traffic-light controls:
 * - Red: Closes the dialog
 * - Yellow: Resets / Clears form state
 * - Green: Toggles maximized / standard view
 */
export function MacWindowHeader({
  title,
  subtitle,
  tag,
  onClose,
  onReset,
  isMaximized,
  onToggleMaximize,
  className = "",
  children,
}: MacWindowHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5 select-none ${className}`}
    >
      {/* Left side: Functional macOS Traffic Lights & Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="group/traffic flex items-center gap-2 shrink-0">
          {/* Close (Red) */}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              title="Закрыть окно (Esc)"
              aria-label="Закрыть"
              className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-hidden"
            >
              <X className="size-2 text-[#4c0002] opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
            </button>
          ) : (
            <span className="size-3 rounded-full bg-[#ff5f56]/40 border border-[#e0443e]/40 inline-block" />
          )}

          {/* Minimize / Reset (Yellow) */}
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              title="Сбросить / Очистить поля"
              aria-label="Сбросить"
              className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-hidden"
            >
              <Minus className="size-2 text-[#573900] opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
            </button>
          ) : (
            <span className="size-3 rounded-full bg-[#ffbd2e]/40 border border-[#dea123]/40 inline-block" />
          )}

          {/* Maximize / Resize (Green) */}
          {onToggleMaximize ? (
            <button
              type="button"
              onClick={onToggleMaximize}
              title={isMaximized ? "Свернуть в стандартный размер" : "Развернуть на весь экран"}
              aria-label="Изменить размер"
              className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-hidden"
            >
              {isMaximized ? (
                <Minimize2 className="size-2 text-[#004e14] opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
              ) : (
                <Maximize2 className="size-2 text-[#004e14] opacity-0 group-hover/traffic:opacity-100 transition-opacity stroke-[2.5]" />
              )}
            </button>
          ) : (
            <span className="size-3 rounded-full bg-[#27c93f]/40 border border-[#1aab29]/40 inline-block" />
          )}
        </div>

        {/* Title & Badge */}
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

      {/* Right side: Optional actions or Close icon button */}
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors sm:hidden"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
