import { baseApi } from "./baseApi"
import type { Cycle } from "@/types/api"

export interface CreateCycleRequest {
  workspaceSlug: string
  projectId: string
  name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateCycleRequest {
  workspaceSlug: string
  projectId: string
  cycleId: string
  name?: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface DeleteCycleRequest {
  workspaceSlug: string
  projectId: string
  cycleId: string
}

export interface AddCycleIssuesRequest {
  workspaceSlug: string
  projectId: string
  cycleId: string
  issue_ids: string[]
}

export interface RemoveCycleIssueRequest {
  workspaceSlug: string
  projectId: string
  cycleId: string
  issueId: string
}

export const cycleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCycles: builder.query<Cycle[], { workspaceSlug: string; projectId: string }>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "Cycle", id: `${projectId}_LIST` },
      ],
    }),

    getCycle: builder.query<Cycle, { workspaceSlug: string; projectId: string; cycleId: string }>({
      query: ({ workspaceSlug, projectId, cycleId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
      providesTags: (_result, _error, { cycleId }) => [{ type: "Cycle", id: cycleId }],
    }),

    createCycle: builder.mutation<Cycle, CreateCycleRequest>({
      query: ({ workspaceSlug, projectId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Cycle", id: `${projectId}_LIST` },
      ],
    }),

    updateCycle: builder.mutation<Cycle, UpdateCycleRequest>({
      query: ({ workspaceSlug, projectId, cycleId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: "Cycle", id: cycleId },
        { type: "Cycle", id: `${projectId}_LIST` },
      ],
    }),

    deleteCycle: builder.mutation<void, DeleteCycleRequest>({
      query: ({ workspaceSlug, projectId, cycleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Cycle", id: `${projectId}_LIST` },
      ],
    }),

    addCycleIssues: builder.mutation<{ added: number }, AddCycleIssuesRequest>({
      query: ({ workspaceSlug, projectId, cycleId, issue_ids }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/issues`,
        method: "POST",
        body: { issue_ids },
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: "Cycle", id: cycleId },
        { type: "Cycle", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    removeCycleIssue: builder.mutation<void, RemoveCycleIssueRequest>({
      query: ({ workspaceSlug, projectId, cycleId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/issues/${issueId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, cycleId }) => [
        { type: "Cycle", id: cycleId },
        { type: "Cycle", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetCyclesQuery,
  useGetCycleQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useDeleteCycleMutation,
  useAddCycleIssuesMutation,
  useRemoveCycleIssueMutation,
} = cycleApi
