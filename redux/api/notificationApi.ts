import { baseApi } from "./baseApi"
import type { Notification } from "@/types/api"

export interface NotificationsResponse {
  data: Notification[]
  unread_count: number
  next_cursor: string | null
}

export interface GetNotificationsRequest {
  workspaceSlug: string
  read?: "true" | "false"
  cursor?: string
  limit?: number
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, GetNotificationsRequest>({
      query: ({ workspaceSlug, read, cursor, limit }) => {
        const queryParams = new URLSearchParams()
        if (read !== undefined) queryParams.set("read", read)
        if (cursor) queryParams.set("cursor", cursor)
        if (limit) queryParams.set("limit", String(limit))
        const qs = queryParams.toString()
        return `/workspaces/${workspaceSlug}/notifications/${qs ? `?${qs}` : ""}`
      },
      providesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Notification", id: `${workspaceSlug}_LIST` },
      ],
    }),

    markAllNotificationsRead: builder.mutation<{ updated: number }, { workspaceSlug: string }>({
      query: ({ workspaceSlug }) => ({
        url: `/workspaces/${workspaceSlug}/notifications/read-all`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Notification", id: `${workspaceSlug}_LIST` },
      ],
    }),

    markNotificationRead: builder.mutation<Notification, { workspaceSlug: string; notificationId: string }>({
      query: ({ workspaceSlug, notificationId }) => ({
        url: `/workspaces/${workspaceSlug}/notifications/${notificationId}/read`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Notification", id: `${workspaceSlug}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationApi
