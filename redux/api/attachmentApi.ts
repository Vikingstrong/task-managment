import { baseApi } from "./baseApi"
import type { IssueAttachment, AttachmentUploadResponse } from "@/types/api"

export interface GetAttachmentsRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export interface RegisterAttachmentRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  body: {
    file_name: string
    file_size: number
    mime_type: string
  }
}

export interface DeleteAttachmentRequest {
  workspaceSlug: string
  projectId: string
  attachmentId: string
  issueId: string
}

export const attachmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttachments: builder.query<IssueAttachment[], GetAttachmentsRequest>({
      query: ({ workspaceSlug, projectId, issueId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments/`,
      transformResponse: (response: IssueAttachment[] | { data: IssueAttachment[] }) => {
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: (_result, _error, { issueId }) => [
        { type: "Attachment", id: `${issueId}_LIST` },
      ],
    }),

    registerAttachment: builder.mutation<
      AttachmentUploadResponse,
      RegisterAttachmentRequest
    >({
      query: ({ workspaceSlug, projectId, issueId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Attachment", id: `${issueId}_LIST` },
        { type: "Activity", id: `${issueId}_LIST` },
      ],
    }),

    deleteAttachment: builder.mutation<void, DeleteAttachmentRequest>({
      query: ({ workspaceSlug, projectId, attachmentId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Attachment", id: `${issueId}_LIST` },
        { type: "Activity", id: `${issueId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetAttachmentsQuery,
  useRegisterAttachmentMutation,
  useDeleteAttachmentMutation,
} = attachmentApi
