import { jwtDecode } from "jwt-decode"

export interface JwtPayload {
  sub?: string
  user_id?: string
  email?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Safely decodes a JWT token without throwing errors.
 */
export function decodeToken(token: string | null | undefined): JwtPayload | null {
  if (!token || typeof token !== "string") return null
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

/**
 * Checks if a JWT token is expired based on its `exp` claim.
 * Includes an optional buffer in seconds (default 30s) to account for clock skew.
 */
export function isTokenExpired(token: string | null | undefined, bufferSeconds = 30): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true

  const expirationTimeMs = payload.exp * 1000
  const currentTimeWithBufferMs = Date.now() + bufferSeconds * 1000

  return currentTimeWithBufferMs >= expirationTimeMs
}

/**
 * Validates whether a token exists, is well-formed, and has not expired.
 */
export function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false
  const payload = decodeToken(token)
  if (!payload) return false
  return !isTokenExpired(token, 0)
}
