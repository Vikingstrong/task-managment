"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  File,
  FileArchive,
  FileCode,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  useGetAttachmentsQuery,
  useRegisterAttachmentMutation,
  useDeleteAttachmentMutation,
} from "@/redux/api/attachmentApi"
import {
  formatFileSize,
  getFileCategory,
  uploadAttachmentBytes,
} from "@/lib/storageUpload"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import { cn } from "@/lib/utils"
import type { IssueAttachment } from "@/types/api"

export interface IssueAttachmentsProps {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export function IssueAttachments({
  workspaceSlug,
  projectId,
  issueId,
}: IssueAttachmentsProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)

  // Uploading state
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadFileName, setUploadFileName] = React.useState<string | null>(null)
  const [uploadFileSize, setUploadFileSize] = React.useState<number>(0)
  const [uploadProgress, setUploadProgress] = React.useState<number>(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Deleting item tracker
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const {
    data: attachments = [],
    isLoading,
    isError,
    refetch,
  } = useGetAttachmentsQuery({ workspaceSlug, projectId, issueId })

  const [registerAttachment] = useRegisterAttachmentMutation()
  const [deleteAttachment] = useDeleteAttachmentMutation()

  const handleFileProcess = async (file: File) => {
    if (!file) return
    setErrorMessage(null)
    setSuccessMessage(null)

    // Check file size (e.g., maximum 50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setErrorMessage("Файл слишком большой. Максимальный размер: 50 МБ")
      return
    }

    setIsUploading(true)
    setUploadFileName(file.name)
    setUploadFileSize(file.size)
    setUploadProgress(0)

    try {
      // Step 1: Register attachment metadata on backend and obtain presigned upload credentials
      const registration = await registerAttachment({
        workspaceSlug,
        projectId,
        issueId,
        body: {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
        },
      }).unwrap()

      if (!registration.upload?.url) {
        throw new Error("Сервер не предоставил URL для загрузки файла")
      }

      // Step 2: Upload raw binary bytes directly to presigned storage endpoint with progress bar
      await uploadAttachmentBytes(
        registration.upload,
        file,
        (percent) => {
          setUploadProgress(percent)
        }
      )

      setSuccessMessage(`Файл "${file.name}" успешно загружен`)
      setTimeout(() => setSuccessMessage(null), 3000)
      refetch()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err) || "Ошибка при передаче файла в хранилище")
    } finally {
      setIsUploading(false)
      setUploadFileName(null)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDelete = async (att: IssueAttachment) => {
    if (!window.confirm(`Удалить вложение "${att.file_name}"?`)) return
    setDeletingId(att.id)
    setErrorMessage(null)
    try {
      await deleteAttachment({
        workspaceSlug,
        projectId,
        attachmentId: att.id,
        issueId,
      }).unwrap()
    } catch (err: unknown) {
      setErrorMessage(getAuthErrorMessage(err) || "Не удалось удалить вложение")
    } finally {
      setDeletingId(null)
    }
  }

  const renderFileIcon = (fileName: string, mimeType?: string) => {
    const category = getFileCategory(fileName, mimeType)
    switch (category) {
      case "image":
        return <ImageIcon className="size-4 text-muted-foreground" />
      case "pdf":
        return <FileText className="size-4 text-muted-foreground" />
      case "code":
        return <FileCode className="size-4 text-muted-foreground" />
      case "archive":
        return <FileArchive className="size-4 text-muted-foreground" />
      default:
        return <File className="size-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed transition-all cursor-pointer select-none",
          isDraggingOver
            ? "border-foreground bg-foreground/5 shadow-2xs"
            : "border-border/70 hover:border-foreground/50 hover:bg-muted/20",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {isUploading ? (
              <Loader2 className="size-4 animate-spin text-foreground" />
            ) : (
              <UploadCloud className="size-4" />
            )}
          </div>
          <div className="text-xs font-medium text-foreground">
            {isUploading
              ? "Идет передача файла в защищенное хранилище..."
              : "Перетащите файл сюда или нажмите для выбора"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Поддерживаются любые типы файлов до 50 МБ
          </div>
        </div>
      </div>

      {/* Active Upload Progress Bar */}
      {isUploading && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                {uploadFileName}
              </span>
              <span className="text-muted-foreground text-[11px]">
                ({formatFileSize(uploadFileSize)})
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-foreground">
              {uploadProgress}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-150 ease-out rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Прикрепленные файлы ({attachments.length})
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span>Загрузка вложений...</span>
          </div>
        ) : isError ? (
          <div className="text-center p-6 text-xs text-destructive">
            Не удалось загрузить список файлов
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center p-6 rounded-lg border border-border/50 bg-muted/10 text-xs text-muted-foreground">
            К этой задаче еще не прикреплено ни одного файла
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border bg-card overflow-hidden">
            {attachments.map((att) => {
              const downloadUrl = att.download_url
              const isDeleting = deletingId === att.id

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                      {renderFileIcon(att.file_name, att.mime_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                        {att.file_name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{formatFileSize(att.file_size)}</span>
                        <span>•</span>
                        <span>
                          {att.uploaded_by?.display_name || "Пользователь"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(att.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Download Button */}
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.file_name}
                      className="inline-flex items-center justify-center size-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Скачать файл"
                    >
                      <Download className="size-3.5" />
                    </a>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(att)}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center size-7 rounded-md border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                      title="Удалить файл"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
