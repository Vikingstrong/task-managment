import { baseApi } from "./baseApi"
import type { ActivityItem, ActivityResponse } from "@/types/api"

export interface GetActivityRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  cursor?: string
  limit?: number
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIssueActivity: builder.query<ActivityResponse, GetActivityRequest>({
      query: ({ workspaceSlug, projectId, issueId, cursor, limit }) => {
        const queryParams = new URLSearchParams()
        if (cursor) queryParams.set("cursor", cursor)
        if (limit) queryParams.set("limit", String(limit))
        const qs = queryParams.toString()
        return `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/activity/${qs ? `?${qs}` : ""}`
      },
      transformResponse: (response: ActivityResponse | ActivityItem[]) => {
        if (Array.isArray(response)) {
          return { data: response, next_cursor: null }
        }
        if (response && Array.isArray(response.data)) {
          return response
        }
        return { data: [], next_cursor: null }
      },
      providesTags: (_result, _error, { issueId }) => [
        { type: "Activity", id: `${issueId}_LIST` },
      ],
    }),
  }),
})

export const { useGetIssueActivityQuery } = activityApi
