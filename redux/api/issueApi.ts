import { baseApi } from "./baseApi"
import type { Issue, IssuePriority } from "@/types/api"

export interface GetIssuesRequest {
  workspaceSlug: string
  projectId: string
  state_id?: string
  priority?: string
  assignee?: string
  search?: string
  cycle?: string
  module?: string
}

export interface CreateIssueRequest {
  workspaceSlug: string
  projectId: string
  body: {
    title: string
    description?: string | null
    state_id: string
    priority?: IssuePriority
    parent_id?: string | null
    assignee_ids?: string[]
    label_ids?: string[]
    start_date?: string | null
    due_date?: string | null
    estimate_points?: number | null
  }
}

export interface UpdateIssueRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  body: {
    title?: string
    description?: string | null
    state_id?: string
    priority?: IssuePriority
    sort_order?: number
    start_date?: string | null
    due_date?: string | null
    estimate_points?: number | null
  }
}

export interface DeleteIssueRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export const issueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query<Issue[], GetIssuesRequest>({
      query: ({ workspaceSlug, projectId, ...params }) => {
        const queryParams = new URLSearchParams()
        if (params.state_id) queryParams.set("state_id", params.state_id)
        if (params.priority) queryParams.set("priority", params.priority)
        if (params.assignee) queryParams.set("assignee", params.assignee)
        if (params.search) queryParams.set("search", params.search)
        if (params.cycle) queryParams.set("cycle", params.cycle)
        if (params.module) queryParams.set("module", params.module)
        const qs = queryParams.toString()
        return `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${qs ? `?${qs}` : ""}`
      },
      transformResponse: (response: Issue[] | { data: Issue[] }) => {
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    getIssue: builder.query<Issue, { workspaceSlug: string; projectId: string; issueId: string }>({
      query: ({ workspaceSlug, projectId, issueId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
      providesTags: (_result, _error, { issueId }) => [{ type: "Issue", id: issueId }],
    }),

    createIssue: builder.mutation<Issue, CreateIssueRequest>({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    updateIssue: builder.mutation<Issue, UpdateIssueRequest>({
      query: ({ workspaceSlug, projectId, issueId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ workspaceSlug, projectId, issueId, body }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          issueApi.util.updateQueryData("getIssues", { workspaceSlug, projectId }, (draft) => {
            const target = draft.find((i) => i.id === issueId)
            if (target) {
              if (body.state_id) target.state_id = body.state_id
              if (body.priority) target.priority = body.priority
              if (body.title) target.title = body.title
              if (body.description !== undefined) target.description = body.description
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (_result, _error, { projectId, issueId }) => [
        { type: "Issue", id: issueId },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    deleteIssue: builder.mutation<void, DeleteIssueRequest>({
      query: ({ workspaceSlug, projectId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    addIssueAssignee: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; issueId: string; userId: string }
    >({
      query: ({ workspaceSlug, projectId, issueId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/assignees`,
        method: "POST",
        body: { user_id: userId },
      }),
      invalidatesTags: (_result, _error, { projectId, issueId }) => [
        { type: "Issue", id: issueId },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    removeIssueAssignee: builder.mutation<
      void,
      { workspaceSlug: string; projectId: string; issueId: string; userId: string }
    >({
      query: ({ workspaceSlug, projectId, issueId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/assignees/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, issueId }) => [
        { type: "Issue", id: issueId },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetIssuesQuery,
  useGetIssueQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useAddIssueAssigneeMutation,
  useRemoveIssueAssigneeMutation,
} = issueApi

