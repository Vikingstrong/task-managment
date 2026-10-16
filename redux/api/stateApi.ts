import { baseApi } from "./baseApi"
import type { ProjectState, StateGroup } from "@/types/api"

export interface GetStatesRequest {
  workspaceSlug: string
  projectId: string
}

export interface CreateStateRequest {
  workspaceSlug: string
  projectId: string
  body: {
    name: string
    color: string
    group: StateGroup
    order?: number
    is_default?: boolean
  }
}

export interface UpdateStateRequest {
  workspaceSlug: string
  projectId: string
  stateId: string
  body: {
    name?: string
    color?: string
    group?: StateGroup
    order?: number
  }
}

export interface DeleteStateRequest {
  workspaceSlug: string
  projectId: string
  stateId: string
  transferToStateId?: string
}

export const stateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<ProjectState[], GetStatesRequest>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
      transformResponse: (response: ProjectState[] | { data: ProjectState[] }) => {
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: "State", id: `${projectId}_LIST` },
      ],
    }),

    createState: builder.mutation<ProjectState, CreateStateRequest>({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "State", id: `${projectId}_LIST` },
      ],
    }),

    updateState: builder.mutation<ProjectState, UpdateStateRequest>({
      query: ({ workspaceSlug, projectId, stateId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "State", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    deleteState: builder.mutation<void, DeleteStateRequest>({
      query: ({ workspaceSlug, projectId, stateId, transferToStateId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`,
        method: "DELETE",
        body: transferToStateId ? { transfer_to_state_id: transferToStateId } : undefined,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "State", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetStatesQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = stateApi
