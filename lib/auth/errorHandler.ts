function toStringValue(val: unknown): string | null {
  if (typeof val === "string") return val
  if (typeof val === "number" || typeof val === "boolean") return String(val)
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>
    if (typeof obj.message === "string") return obj.message
    if (typeof obj.detail === "string") return obj.detail
    if (typeof obj.error === "string") return obj.error
    if (typeof obj.msg === "string") return obj.msg
    if (typeof obj.description === "string") return obj.description
  }
  return null
}

export function getAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "Произошла ошибка. Попробуйте снова."
  }

  const rtkErr = err as {
    status?: number | string
    data?: unknown
    error?: unknown
  }

  // Network or CORS connection failure
  if (rtkErr.status === "FETCH_ERROR") {
    return "Не удалось связаться с сервером. Проверьте, запущен ли бэкенд на порту 4000."
  }

  if (rtkErr.data && typeof rtkErr.data === "object") {
    const dataObj = rtkErr.data as Record<string, unknown>

    // 1. Array of detail items (e.g. FastAPI validation)
    if (Array.isArray(dataObj.detail)) {
      const msgs = dataObj.detail
        .map((item) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object") {
            const i = item as Record<string, unknown>
            return typeof i.msg === "string" ? i.msg : toStringValue(i)
          }
          return null
        })
        .filter(Boolean)
      if (msgs.length > 0) return msgs.join(". ")
    }

    // 2. detail could be string or object with { code, message }
    const detailStr = toStringValue(dataObj.detail)
    if (detailStr) return detailStr

    // 3. message could be string or object with { code, message }
    const messageStr = toStringValue(dataObj.message)
    if (messageStr) return messageStr

    // 4. error could be string or object
    const errorStr = toStringValue(dataObj.error)
    if (errorStr) return errorStr
  }

  // Check top-level error property
  const topError = toStringValue(rtkErr.error)
  if (topError) return topError

  // Fallback by status codes
  if (rtkErr.status === 400) return "Некорректные данные запроса."
  if (rtkErr.status === 401) return "Неверный email или пароль."
  if (rtkErr.status === 404) return "Сервер вернул 404. Маршрут не найден."
  if (rtkErr.status === 409) return "Пользователь с таким email уже зарегистрирован."
  if (rtkErr.status === 422) return "Ошибка валидации переданных полей."

  return "Ошибка при обработке запроса. Попробуйте позже."
}
