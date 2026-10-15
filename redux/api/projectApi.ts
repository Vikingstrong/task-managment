import { baseApi } from "./baseApi"
import type { Project, ProjectMember, ProjectRole } from "@/types/api"

export interface CreateProjectRequest {
  workspaceSlug: string
  body: {
    name: string
    identifier: string
    description?: string | null
    lead_id?: string | null
  }
}

export interface UpdateProjectRequest {
  workspaceSlug: string
  projectId: string
  body: {
    name?: string
    description?: string | null
    lead_id?: string | null
    is_archived?: boolean
  }
}

export interface DeleteProjectRequest {
  workspaceSlug: string
  projectId: string
}

export interface ProjectMembersRequest {
  workspaceSlug: string
  projectId: string
}

export interface AddProjectMemberRequest {
  workspaceSlug: string
  projectId: string
  body: {
    user_id: string
    role: ProjectRole
  }
}

export interface RemoveProjectMemberRequest {
  workspaceSlug: string
  projectId: string
  userId: string
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], { workspaceSlug: string; is_archived?: boolean }>({
      query: ({ workspaceSlug, is_archived }) => {
        const queryParams = is_archived !== undefined ? `?is_archived=${is_archived}` : ""
        return `/workspaces/${workspaceSlug}/projects/${queryParams}`
      },
      providesTags: (result, _error, { workspaceSlug }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Project" as const, id })),
              { type: "Project", id: `${workspaceSlug}_LIST` },
            ]
          : [{ type: "Project", id: `${workspaceSlug}_LIST` }],
    }),

    getProject: builder.query<Project, { workspaceSlug: string; projectId: string }>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}`,
      providesTags: (_result, _error, { projectId }) => [{ type: "Project", id: projectId }],
    }),

    createProject: builder.mutation<Project, CreateProjectRequest>({
      query: ({ workspaceSlug, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceSlug }) => [
        { type: "Project", id: `${workspaceSlug}_LIST` },
      ],
    }),

    updateProject: builder.mutation<Project, UpdateProjectRequest>({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceSlug, projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: `${workspaceSlug}_LIST` },
      ],
    }),

    deleteProject: builder.mutation<void, DeleteProjectRequest>({
      query: ({ workspaceSlug, projectId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { workspaceSlug, projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: `${workspaceSlug}_LIST` },
      ],
    }),

    getProjectMembers: builder.query<ProjectMember[], ProjectMembersRequest>({
      query: ({ workspaceSlug, projectId }) =>
        `/workspaces/${workspaceSlug}/projects/${projectId}/members`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: `${projectId}_MEMBERS` },
      ],
    }),

    addProjectMember: builder.mutation<void, AddProjectMemberRequest>({
      query: ({ workspaceSlug, projectId, body }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: `${projectId}_MEMBERS` },
      ],
    }),

    removeProjectMember: builder.mutation<void, RemoveProjectMemberRequest>({
      query: ({ workspaceSlug, projectId, userId }) => ({
        url: `/workspaces/${workspaceSlug}/projects/${projectId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: `${projectId}_MEMBERS` },
      ],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
} = projectApi
