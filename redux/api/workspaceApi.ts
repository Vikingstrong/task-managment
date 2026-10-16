import { baseApi } from "./baseApi"
import type { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceInvite } from "@/types/api"

export interface CreateWorkspaceRequest {
  name: string
  slug: string
}

export interface UpdateWorkspaceRequest {
  slug: string
  body: {
    name?: string
    slug?: string
  }
}

export interface InviteMemberRequest {
  workspaceSlug: string
  email: string
  role: WorkspaceRole
}

export interface UpdateMemberRoleRequest {
  workspaceSlug: string
  userId: string
  role: WorkspaceRole
}

export interface RemoveMemberRequest {
  workspaceSlug: string
  userId: string
}

export const workspaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces/",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Workspace" as const, id })),
              { type: "Workspace", id: "LIST" },
            ]
          : [{ type: "Workspace", id: "LIST" }],
    }),

    getWorkspace: builder.query<Workspace, string>({
      query: (slug) => `/workspaces/${slug}`,
      providesTags: (_result, _error, slug) => [
        { type: "Workspace", id: slug },
        { type: "Workspace", id: "CURRENT" },
      ],
    }),

    createWorkspace: builder.mutation<Workspace, CreateWorkspaceRequest>({
      query: (body) => ({
        url: "/workspaces/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Workspace", id: "LIST" }],
    }),

    updateWorkspace: builder.mutation<Workspace, UpdateWorkspaceRequest>({
      query: ({ slug, body }) => ({
        url: `/workspaces/${slug}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { slug }) => [
        { type: "Workspace", id: slug },
        { type: "Workspace", id: "CURRENT" },
        { type: "Workspace", id: "LIST" },
      ],
    }),

    deleteWorkspace: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/workspaces/${slug}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Workspace", id: "LIST" }],
    }),

    getWorkspaceMembers: builder.query<WorkspaceMember[], string>({
      query: (slug) => `/workspaces/${slug}/members`,
      providesTags: (_result, _error, slug) => [
        { type: "Workspace", id: `${slug}_MEMBERS` },
      ],
    }),

    inviteWorkspaceMember: builder.mutation<WorkspaceInvite, InviteMemberRequest>({
      query: ({ workspaceSlug, ...body }) => ({
        url: `/workspaces/${workspaceSlug}/members/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Workspace", id: `${workspaceSlug}_MEMBERS` },
      ],
    }),

    updateWorkspaceMember: builder.mutation<void, UpdateMemberRoleRequest>({
      query: ({ workspaceSlug, userId, role }) => ({
        url: `/workspaces/${workspaceSlug}/members/${userId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Workspace", id: `${workspaceSlug}_MEMBERS` },
      ],
    }),

    removeWorkspaceMember: builder.mutation<void, RemoveMemberRequest>({
      query: ({ workspaceSlug, userId }) => ({
        url: `/workspaces/${workspaceSlug}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Workspace", id: `${workspaceSlug}_MEMBERS` },
      ],
    }),
  }),
})

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useInviteWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
} = workspaceApi
