import { baseApi } from "./baseApi"
import { issueApi } from "./issueApi"
import type { ProjectLabel } from "@/types/api"

export interface CreateLabelRequest {
  workspaceSlug: string
  projectId: string
  name: string
  color: string
}

export interface UpdateLabelRequest {
  workspaceSlug: string
  projectId: string
  labelId: string
  name?: string
  color?: string
}

export interface DeleteLabelRequest {
  workspaceSlug: string
  projectId: string
  labelId: string
}

export interface AttachLabelRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  label_id: string
}

export interface DetachLabelRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  labelId: string
}

export const labelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabels: builder.query<ProjectLabel[], { workspaceSlug: string; projectId: string }>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/labels/`,
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: "Label", id: `${projectId}_LIST` },
      ],
    }),

    createLabel: builder.mutation<ProjectLabel, CreateLabelRequest>({
      query: ({ workspaceSlug, projectId, name, color }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels/`,
        method: "POST",
        body: { name, color },
      }),
      transformResponse: (response: any) => {
        if (response && response.data) return response.data
        return response
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Label", id: `${projectId}_LIST` },
      ],
    }),

    updateLabel: builder.mutation<ProjectLabel, UpdateLabelRequest>({
      query: ({ workspaceSlug, projectId, labelId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Label", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    deleteLabel: builder.mutation<void, DeleteLabelRequest>({
      query: ({ workspaceSlug, projectId, labelId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Label", id: `${projectId}_LIST` },
        { type: "Issue", id: `${projectId}_LIST` },
      ],
    }),

    attachLabelToIssue: builder.mutation<void, AttachLabelRequest>({
      query: ({ workspaceSlug, projectId, issueId, label_id }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/labels`,
        method: "POST",
        body: { label_id },
      }),
      async onQueryStarted({ workspaceSlug, projectId, issueId, label_id }, { dispatch, queryFulfilled, getState }) {
        const state: any = getState()
        const labelQuery = labelApi.endpoints.getLabels.select({ workspaceSlug, projectId })(state)
        const labelObj = labelQuery?.data?.find((l) => l.id === label_id)

        const patchResult = dispatch(
          issueApi.util.updateQueryData("getIssues", { workspaceSlug, projectId }, (draft) => {
            const target = draft.find((i) => i.id === issueId)
            if (target) {
              if (!target.labels) target.labels = []
              const already = target.labels.some(
                (x: any) => (x.id || x.label_id || x.label?.id) === label_id
              )
              if (!already) {
                target.labels.push({
                  issue_id: issueId,
                  label_id,
                  label: labelObj || { id: label_id, name: "...", color: "#888" },
                } as any)
              }
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

    detachLabelFromIssue: builder.mutation<void, DetachLabelRequest>({
      query: ({ workspaceSlug, projectId, issueId, labelId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/labels/${labelId}`,
        method: "DELETE",
      }),
      async onQueryStarted({ workspaceSlug, projectId, issueId, labelId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          issueApi.util.updateQueryData("getIssues", { workspaceSlug, projectId }, (draft) => {
            const target = draft.find((i) => i.id === issueId)
            if (target && Array.isArray(target.labels)) {
              target.labels = target.labels.filter(
                (x: any) => (x.id || x.label_id || x.label?.id) !== labelId
              )
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
  }),
})

export const {
  useGetLabelsQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
  useAttachLabelToIssueMutation,
  useDetachLabelFromIssueMutation,
} = labelApi
