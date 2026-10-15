/**
 * Client-side cookie utilities for syncing auth tokens with Next.js Server Components.
 */

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  setCookie("access_token", accessToken, 1) // 1 day
  setCookie("refresh_token", refreshToken, 30) // 30 days
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  }
}

export function clearAuthTokens() {
  deleteCookie("access_token")
  deleteCookie("refresh_token")
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  }
}

export function getStoredTokens() {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null }
  }
  const accessToken = getCookie("access_token") || localStorage.getItem("access_token")
  const refreshToken = getCookie("refresh_token") || localStorage.getItem("refresh_token")
  return { accessToken, refreshToken }
}
