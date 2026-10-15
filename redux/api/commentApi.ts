import { baseApi } from "./baseApi"
import type { IssueComment } from "@/types/api"

export interface GetCommentsRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export interface CreateCommentRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  body: string
  parent_comment_id?: string | null
}

export interface UpdateCommentRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  commentId: string
  body: string
}

export interface DeleteCommentRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  commentId: string
}

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<IssueComment[], GetCommentsRequest>({
      query: ({ workspaceSlug, projectId, issueId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
      providesTags: (_result, _error, { issueId }) => [
        { type: "Comment", id: `${issueId}_LIST` },
      ],
    }),

    createComment: builder.mutation<IssueComment, CreateCommentRequest>({
      query: ({ workspaceSlug, projectId, issueId, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Comment", id: `${issueId}_LIST` },
      ],
    }),

    updateComment: builder.mutation<IssueComment, UpdateCommentRequest>({
      query: ({ workspaceSlug, projectId, issueId, commentId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        method: "PATCH",
        body: { body },
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Comment", id: `${issueId}_LIST` },
      ],
    }),

    deleteComment: builder.mutation<void, DeleteCommentRequest>({
      query: ({ workspaceSlug, projectId, issueId, commentId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Comment", id: `${issueId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi
