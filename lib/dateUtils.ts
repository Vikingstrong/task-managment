/**
 * Date and time helpers for normalizing dates between frontend inputs (<input type="date">)
 * and backend Zod ISO datetime validator (z.string().datetime()).
 */

/**
 * Converts a date input string (e.g. "2026-10-25" or ISO string) to an ISO-8601 UTC string
 * accepted by the backend Zod datetime schema: z.string().datetime().
 * Returns null if empty, falsy, or invalid.
 */
export function formatToIsoDateTime(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) {
    return null
  }
  const trimmed = dateStr.trim()

  // Standard HTML5 date input format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00.000Z`)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }

  // Already an ISO string or other parseable date
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Extracts "YYYY-MM-DD" from an ISO date-time string for HTML <input type="date">.
 */
export function toDateInputValue(isoString?: string | null): string {
  if (!isoString) return ""
  return isoString.split("T")[0]
}

/**
 * Formats an ISO date-time string into a human-friendly short date (e.g. "25 окт.").
 */
export function formatDisplayDate(
  isoString?: string | null,
  locale = "ru-RU"
): string {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })
}

/**
 * Determines whether a date is overdue relative to now.
 */
export function isDateOverdue(isoString?: string | null): boolean {
  if (!isoString) return false
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return false
  return d.getTime() < Date.now()
}
