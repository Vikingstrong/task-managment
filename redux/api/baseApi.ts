import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"
import { Mutex } from "async-mutex"

import type { RootState } from "@/redux/store"
import type { AuthResponse } from "@/types/api"
import { setTokens, logout, updateUser } from "@/redux/features/authSlice"
import { getStoredTokens } from "@/lib/auth/cookies"

const mutex = new Mutex()

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1"

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState
    const token = state.auth.accessToken || getStoredTokens().accessToken

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  
  await mutex.waitForUnlock()
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const state = api.getState() as RootState
        const refreshToken = state.auth.refreshToken || getStoredTokens().refreshToken

        if (refreshToken) {
          const refreshResult = await rawBaseQuery(
            {
              url: "/auth/refresh",
              method: "POST",
              body: { refresh_token: refreshToken },
            },
            api,
            extraOptions
          )

          if (refreshResult.data) {
            const data = refreshResult.data as AuthResponse
            api.dispatch(
              setTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
              })
            )
            if (data.user) {
              api.dispatch(updateUser(data.user))
            }
            // Retry initial request with newly acquired token
            result = await rawBaseQuery(args, api, extraOptions)
          } else {
            api.dispatch(logout())
          }
        } else {
          api.dispatch(logout())
        }
      } finally {
        release()
      }
    } else {
      // Wait for release by the leading request and retry
      await mutex.waitForUnlock()
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Workspace",
    "Project",
    "State",
    "Label",
    "Issue",
    "Comment",
    "Relation",
    "Cycle",
    "Module",
    "Notification",
    "Attachment",
  ],
  endpoints: () => ({}),
})
