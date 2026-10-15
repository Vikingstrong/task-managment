"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateWorkspaceMutation } from "@/redux/api/workspaceApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { MacModal } from "@/components/common/MacModal"
import type { Workspace } from "@/types/api"

/**
 * Transliterates Cyrillic and normalizes into a clean URL slug:
 * Allowed: ^[a-z0-9-]+$
 */
function toKebabSlug(text: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  }

  return text
    .toLowerCase()
    .split("")
    .map((c) => cyrillicMap[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (workspace: Workspace) => void
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation()

  // Reset form when reopened
  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setSlug("")
      setIsSlugManuallyEdited(false)
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isSlugManuallyEdited) {
      setSlug(toKebabSlug(val))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()

    if (!trimmedName) {
      setErrorMessage("Введите название рабочего пространства")
      return
    }

    if (!trimmedSlug || !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setErrorMessage("Slug может содержать только строчные латинские буквы, цифры и дефис")
      return
    }

    try {
      const created = await createWorkspace({
        name: trimmedName,
        slug: trimmedSlug,
      }).unwrap()

      onSuccess(created)
      onClose()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  return (
    <MacModal
      isOpen={isOpen}
      onClose={onClose}
      title="Новое рабочее пространство"
      subtitle="Создайте изолированное пространство для вашей команды и проектов"
      defaultWidth="max-w-xl sm:max-w-2xl"
      maximizedWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ws-name-input" className="text-xs sm:text-sm font-medium">
            Название пространства
          </Label>
          <Input
            id="ws-name-input"
            type="text"
            required
            autoFocus
            placeholder="Например, Команда разработки"
            value={name}
            onChange={handleNameChange}
            disabled={isLoading}
            className="h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-slug-input" className="text-xs sm:text-sm font-medium">
              URL идентификатор (slug)
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              /^[a-z0-9-]+$/
            </span>
          </div>
          <div className="flex items-center rounded-md border border-input bg-transparent px-3 text-xs sm:text-sm shadow-xs focus-within:ring-1 focus-within:ring-ring">
            <span className="text-muted-foreground select-none font-mono text-xs mr-1">
              /
            </span>
            <input
              id="ws-slug-input"
              type="text"
              required
              placeholder="komanda-razrabotki"
              value={slug}
              onChange={handleSlugChange}
              disabled={isLoading}
              className="w-full bg-transparent py-2 text-xs sm:text-sm outline-hidden font-mono"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Используется в URL: yourdomain.com/{slug || "slug"}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Создание...</span>
              </>
            ) : (
              "Создать воркспейс"
            )}
          </Button>
        </div>
      </form>
    </MacModal>
  )
}
