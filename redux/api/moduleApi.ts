import { baseApi } from "./baseApi"
import type { Module, ModuleStatus } from "@/types/api"

export interface CreateModuleRequest {
  workspaceSlug: string
  projectId: string
  name: string
  description?: string | null
  status?: ModuleStatus
  lead_id?: string | null
  start_date?: string | null
  target_date?: string | null
}

export interface UpdateModuleRequest {
  workspaceSlug: string
  projectId: string
  moduleId: string
  name?: string
  description?: string | null
  status?: ModuleStatus
  lead_id?: string | null
  start_date?: string | null
  target_date?: string | null
}

export interface DeleteModuleRequest {
  workspaceSlug: string
  projectId: string
  moduleId: string
}

export interface AddModuleIssuesRequest {
  workspaceSlug: string
  projectId: string
  moduleId: string
  issue_ids: string[]
}

export interface RemoveModuleIssueRequest {
  workspaceSlug: string
  projectId: string
  moduleId: string
  issueId: string
}

export const moduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModules: builder.query<Module[], { workspaceSlug: string; projectId: string }>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/modules/`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "Module", id: `${projectId}_LIST` },
      ],
    }),

    getModule: builder.query<Module, { workspaceSlug: string; projectId: string; moduleId: string }>({
      query: ({ workspaceSlug, projectId, moduleId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
      providesTags: (_result, _error, { moduleId }) => [{ type: "Module", id: moduleId }],
    }),

    createModule: builder.mutation<Module, CreateModuleRequest>({
      query: ({ workspaceSlug, projectId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Module", id: `${projectId}_LIST` },
      ],
    }),

    updateModule: builder.mutation<Module, UpdateModuleRequest>({
      query: ({ workspaceSlug, projectId, moduleId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, moduleId }) => [
        { type: "Module", id: moduleId },
        { type: "Module", id: `${projectId}_LIST` },
      ],
    }),

    deleteModule: builder.mutation<void, DeleteModuleRequest>({
      query: ({ workspaceSlug, projectId, moduleId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Module", id: `${projectId}_LIST` },
      ],
    }),

    addModuleIssues: builder.mutation<{ added: number }, AddModuleIssuesRequest>({
      query: ({ workspaceSlug, projectId, moduleId, issue_ids }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues`,
        method: "POST",
        body: { issue_ids },
      }),
      invalidatesTags: (_result, _error, { projectId, moduleId }) => [
        { type: "Module", id: moduleId },
        { type: "Module", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    removeModuleIssue: builder.mutation<void, RemoveModuleIssueRequest>({
      query: ({ workspaceSlug, projectId, moduleId, issueId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, moduleId }) => [
        { type: "Module", id: moduleId },
        { type: "Module", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetModulesQuery,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useAddModuleIssuesMutation,
  useRemoveModuleIssueMutation,
} = moduleApi
