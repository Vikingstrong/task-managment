import { baseApi } from "./baseApi"
import type { WorkspaceInvite } from "@/types/api"

export interface AcceptInviteResponse {
  workspace_id: string
  user_id: string
  role: string
}

export const inviteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvite: builder.query<WorkspaceInvite, string>({
      query: (token) => `/invites/${token}`,
      providesTags: (_result, _error, token) => [{ type: "Invite", id: token }],
    }),

    acceptInvite: builder.mutation<AcceptInviteResponse, string>({
      query: (token) => ({
        url: `/invites/${token}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Workspace", "Invite"],
    }),
  }),
})

export const {
  useGetInviteQuery,
  useAcceptInviteMutation,
} = inviteApi
