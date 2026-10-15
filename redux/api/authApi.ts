import { baseApi } from "./baseApi"
import type { AuthResponse, User } from "@/types/api"
import { setCredentials, logout as logoutAction, updateUser } from "@/redux/features/authSlice"

export interface RegisterRequest {
  email: string
  password: string
  display_name: string
  invite_token?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  display_name?: string
  avatar_url?: string | null
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            })
          )
        } catch {
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            })
          )
        } catch {
          // Handled in component
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    logout: builder.mutation<void, { refresh_token: string }>({
      query: ({ refresh_token }) => ({
        url: "/auth/logout",
        method: "POST",
        body: { refresh_token },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(logoutAction())
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data))
        } catch {
          // Handled
        }
      },
      providesTags: ["User"],
    }),

    updateMe: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/auth/me",
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data))
        } catch {
          // Handled
        }
      },
      invalidatesTags: ["User"],
    }),

    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
} = authApi
