import { baseApi } from "./baseApi"
import type { IssueRelation, IssueRelationsResponse, RelationType } from "@/types/api"

export interface GetRelationsRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
}

export interface CreateRelationRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  related_issue_id: string
  relation_type: RelationType
}

export interface DeleteRelationRequest {
  workspaceSlug: string
  projectId: string
  issueId: string
  linkId: string
}

export const relationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRelations: builder.query<IssueRelationsResponse, GetRelationsRequest>({
      query: ({ workspaceSlug, projectId, issueId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/`,
      providesTags: (_result, _error, { issueId }) => [
        { type: "Relation", id: `${issueId}_LIST` },
      ],
    }),

    createRelation: builder.mutation<IssueRelation, CreateRelationRequest>({
      query: ({ workspaceSlug, projectId, issueId, related_issue_id, relation_type }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/`,
        method: "POST",
        body: { related_issue_id, relation_type },
      }),
      invalidatesTags: (_result, _error, { issueId, related_issue_id }) => [
        { type: "Relation", id: `${issueId}_LIST` },
        { type: "Relation", id: `${related_issue_id}_LIST` },
      ],
    }),

    deleteRelation: builder.mutation<void, DeleteRelationRequest>({
      query: ({ workspaceSlug, projectId, issueId, linkId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { issueId }) => [
        { type: "Relation", id: `${issueId}_LIST` },
      ],
    }),
  }),
})

export const {
  useGetRelationsQuery,
  useCreateRelationMutation,
  useDeleteRelationMutation,
} = relationApi
