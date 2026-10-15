import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/types/api"
import { saveAuthTokens, clearAuthTokens, getStoredTokens } from "@/lib/auth/cookies"

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const tokens = typeof window !== "undefined" ? getStoredTokens() : { accessToken: null, refreshToken: null }

const initialState: AuthState = {
  user: null,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  isAuthenticated: !!tokens.accessToken,
  isLoading: false,
  error: null,
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User
        accessToken: string
        refreshToken: string
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true
      state.error = null
      saveAuthTokens(accessToken, refreshToken)
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken: string
      }>
    ) => {
      const { accessToken, refreshToken } = action.payload
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true
      saveAuthTokens(accessToken, refreshToken)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.isLoading = false
      clearAuthTokens()
    },
  },
})

export const {
  setCredentials,
  updateUser,
  setTokens,
  setLoading,
  setError,
  logout,
} = authSlice.actions

export default authSlice.reducer
