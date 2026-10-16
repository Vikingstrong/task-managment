/**
 * Storage upload helper for presigned binary uploads.
 * Uses native XMLHttpRequest to:
 * 1. Track accurate upload progress percentages via xhr.upload.onprogress.
 * 2. Prevent automated injection of Authorization or Accept headers that cause
 *    CORS preflight rejection or S3/MinIO presigned signature invalidation.
 */

export interface PresignedUploadConfig {
  url: string
  method?: string
  headers?: Record<string, string>
  expires_in?: number
}

export type UploadProgressCallback = (
  percentage: number,
  loadedBytes: number,
  totalBytes: number
) => void

export function uploadAttachmentBytes(
  upload: PresignedUploadConfig,
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const method = (upload.method || "PUT").toUpperCase()
    const targetUrl = upload.url

    xhr.open(method, targetUrl, true)

    // Apply only explicitly provided presigned headers (e.g. content-type)
    let hasContentType = false
    if (upload.headers) {
      for (const [key, value] of Object.entries(upload.headers)) {
        if (key.toLowerCase() === "content-type") {
          hasContentType = true
        }
        xhr.setRequestHeader(key, value)
      }
    }

    // Default content type if not defined in presigned headers
    if (!hasContentType && file.type) {
      xhr.setRequestHeader("Content-Type", file.type)
    }

    // Upload progress listener
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(
            100,
            Math.max(0, Math.round((event.loaded / event.total) * 100))
          )
          onProgress(percent, event.loaded, event.total)
        }
      }
    }

    // Abort controller integration
    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return reject(new Error("Загрузка отменена"))
      }
      signal.addEventListener("abort", () => {
        xhr.abort()
        reject(new Error("Загрузка отменена"))
      })
    }

    // Completion handler
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100, file.size, file.size)
        resolve()
      } else {
        reject(
          new Error(
            `Ошибка загрузки (${xhr.status}): ${xhr.statusText || "Не удалось сохранить файл в хранилище"}`
          )
        )
      }
    }

    // Error and timeout handlers
    xhr.onerror = () => {
      reject(new Error("Сетевая ошибка при передаче файла в хранилище"))
    }

    xhr.ontimeout = () => {
      reject(new Error("Превышено время ожидания передачи файла"))
    }

    xhr.onabort = () => {
      reject(new Error("Загрузка отменена"))
    }

    // Send raw binary payload
    xhr.send(file)
  })
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 Б"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Б", "КБ", "МБ", "ГБ", "ТБ"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || "Б"}`
}

/**
 * Categorize file based on mime type or extension for rendering appropriate macOS icon
 */
export function getFileCategory(
  fileName: string,
  mimeType?: string
): "image" | "pdf" | "code" | "archive" | "document" | "file" {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  const mime = (mimeType || "").toLowerCase()

  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext)
  ) {
    return "image"
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf"
  }
  if (
    ["zip", "tar", "gz", "7z", "rar", "bz2"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed")
  ) {
    return "archive"
  }
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "json",
      "html",
      "css",
      "py",
      "go",
      "rs",
      "cpp",
      "c",
      "java",
      "sql",
      "yaml",
      "yml",
      "sh",
    ].includes(ext)
  ) {
    return "code"
  }
  if (
    ["doc", "docx", "txt", "md", "rtf", "odt", "csv", "xls", "xlsx"].includes(
      ext
    )
  ) {
    return "document"
  }
  return "file"
}
