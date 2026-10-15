<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Task Management with Workflow (Frontend Guide)

> **Role & Purpose**: This document serves as the single source of truth for AI agents and human developers building the Next.js frontend for our Jira/Plane-inspired multi-tenant Task Management system.

---

## 1. Project Overview & Philosophy

The project is an enterprise-grade, modern, high-performance **Multi-Tenant Task Management & Workflow platform** (inspired by Linear, Plane, and Jira).

### Key Product Pillars
- **Multi-Tenancy**: Isolated workspaces with role-based access (`owner`, `admin`, `member`, `guest`).
- **Flexible Workflow Engine**: Custom issue states grouped by lifecycle phases (`backlog`, `unstarted`, `started`, `completed`, `cancelled`).
- **Issue Tracking & Tree**: Sequence keys (e.g., `PRJ-42`), sub-issues (`parent_id`), priority triage, estimates, due dates, multiple assignees, colored tags.
- **Dependency & Relations Graph**: Issue links (`blocks`, `blocked_by`, `relates_to`, `duplicates`).
- **Agile Cycles (Sprints)** & **Modules (Epics/Roadmaps)** with real-time aggregate progress calculation.
- **Collaboration**: Rich threaded discussions (`parent_comment_id`), full audit trail / activity log, file attachments via direct presigned storage upload, and an in-app notification center.

---

## 2. Technical Stack & Environment

- **Framework**: Next.js 16.4.0 (App Router, Turbopack, Server Actions, React 19).
  - *Next.js 16 Notice*: `cookies()`, `headers()`, and route `params`/`searchParams` are asynchronous (`await cookies()`, `await params`).
- **Language**: TypeScript 5 (Strict Mode).
- **Styling**: TailwindCSS v4 with `@tailwindcss/turbopack`, `tw-animate-css`.
- **UI Components**: Base UI (`@base-ui/react`), shadcn/ui design patterns, Lucide icons (`lucide-react`), `next-themes` (Dark/Light mode).
- **API Base Path**: `/api/v1` (Backend REST API with JWT Bearer Authentication).

---

## 3. Backend API & Domain Specification (OpenAPI Summary)

### 3.1 Authentication & Profile (`/auth/*`)
- `POST /api/v1/auth/register`: `{ email, password (min 8), display_name (1..100), invite_token? }` -> `{ access_token, refresh_token, user }`
- `POST /api/v1/auth/login`: `{ email, password }` -> `{ access_token, refresh_token, user }`
- `POST /api/v1/auth/refresh`: `{ refresh_token }` -> `{ access_token, refresh_token, user }` (Token rotation)
- `POST /api/v1/auth/logout`: `{ refresh_token }` -> `204 No Content`
- `GET /api/v1/auth/me`: Get current authenticated user profile
- `PATCH /api/v1/auth/me`: `{ display_name?, avatar_url? }` -> Updated user profile
- `POST /api/v1/auth/change-password`: `{ current_password, new_password (min 8) }` -> `204 No Content` (Revokes all refresh tokens)

### 3.2 Workspaces & Members (`/workspaces/*`, `/invites/*`)
- **Workspaces**:
  - `GET /api/v1/workspaces/`: List workspaces user belongs to.
  - `POST /api/v1/workspaces/`: `{ name, slug: ^[a-z0-9-]+$ }` (Create workspace).
  - `GET /api/v1/workspaces/{workspaceSlug}`: Details.
  - `PATCH /api/v1/workspaces/{workspaceSlug}`: Edit name or slug (Admin+).
  - `DELETE /api/v1/workspaces/{workspaceSlug}`: Delete (Owner only).
- **Members**:
  - `GET /api/v1/workspaces/{workspaceSlug}/members`: Member list with roles (`owner`, `admin`, `member`, `guest`) and user metadata.
  - `POST /api/v1/workspaces/{workspaceSlug}/members`: Add existing user (`user_id`, `role`).
  - `PATCH /api/v1/workspaces/{workspaceSlug}/members/{userId}`: Change role (`admin`, `member`, `guest`).
  - `DELETE /api/v1/workspaces/{workspaceSlug}/members/{userId}`: Remove member.
  - `POST /api/v1/workspaces/{workspaceSlug}/members/invite`: Invite by email (`email`, `role`).
- **Invites**:
  - `GET /api/v1/invites/{token}`: Public invite metadata preview.
  - `POST /api/v1/invites/{token}/accept`: Accept invite (authenticated).

### 3.3 Projects & Project Members
- `GET /api/v1/workspaces/{workspaceSlug}/projects/`: Project list (`identifier` e.g. `TASK`, `lead_id`, `is_archived`).
- `POST /api/v1/workspaces/{workspaceSlug}/projects/`: `{ name, identifier: ^[A-Z0-9]+$, description?, lead_id? }` (Admin+).
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}`
- `PATCH /api/v1/workspaces/{workspaceSlug}/projects/{projectId}`: `{ name?, description?, lead_id?, is_archived? }`
- `DELETE /api/v1/workspaces/{workspaceSlug}/projects/{projectId}`
- **Project Members**:
  - `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/members`: Roles: `admin`, `member`, `viewer`.
  - `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/members`: `{ user_id, role }`.
  - `DELETE /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/members/{userId}`.

### 3.4 Custom Workflow States (`/states/*`)
Workflow states control the kanban columns and lifecycle transitions:
- Groups: `backlog` | `unstarted` | `started` | `completed` | `cancelled`
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/states/`: List states.
- `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/states/`: `{ name, color (#hex), group, order, is_default }`.
- `PATCH /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/states/{stateId}`: Update name/color/group/order.
- `DELETE /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/states/{stateId}`: `{ transfer_to_state_id }` reassigns issues before state deletion.

### 3.5 Labels (`/labels/*`)
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/labels/`: List labels (`name`, `color` `#hex`).
- `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/labels/`: Create label.
- `PATCH` / `DELETE` on `{labelId}`.

### 3.6 Issues / Tasks (`/issues/*`)
The central entity of the system:
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/`
  - Filters: `state`, `priority`, `assignee`, `label`, `cycle`, `module`, `created_by`, `parent_id`, `search`, `due_before`, `due_after`, `created_before`, `created_after`.
  - Sorting: `sort_by` (`created_at`, `updated_at`, `priority`, `due_date`, `sort_order`), `order` (`asc`, `desc`).
  - Grouping: `group_by` (`state`, `priority`, `assignee`).
  - Pagination: cursor-based (`cursor`, `limit` default 50).
  - Returns: `{ data, next_cursor, group_by, groups: [{ key, issues }] }`.
- `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/`:
  - Body: `{ title, description?, state_id, priority ("none"|"low"|"medium"|"high"|"urgent"), parent_id?, assignee_ids?, label_ids?, start_date?, due_date?, estimate_points? }`.
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}`
- `PATCH /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}`: Edit issue fields & `sort_order`.
- `DELETE /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}`: Soft-delete.
- Sub-resources:
  - `POST/DELETE /assignees` & `/assignees/{userId}`
  - `POST/DELETE /labels` & `/labels/{labelId}`

### 3.7 Comments & Discussions (`/comments/*`)
- Threaded hierarchy via `parent_comment_id`.
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/comments/`: Tree/list of comments.
- `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/comments/`: `{ body, parent_comment_id? }`.
- `PATCH` & `DELETE` on `{commentId}` (Author or admin, soft-delete).

### 3.8 Issue Relations & Blockers (`/relations/*`)
- Dependency types: `blocks` | `blocked_by` | `relates_to` | `duplicates`.
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/relations/`:
  - Returns partitioned groups: `{ blocks: [], blocked_by: [], relates_to: [], duplicates: [] }` with related issue snippets.
- `POST /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/relations/`: `{ related_issue_id, relation_type }`.
- `DELETE /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/relations/{linkId}` (removes mirror link automatically).

### 3.9 Cycles (Sprints) & Modules (Epics / Roadmaps)
- **Cycles**:
  - Statuses: `upcoming` | `active` | `completed`.
  - Aggregations: `progress` (`total`, `backlog`, `unstarted`, `started`, `completed`, `cancelled`, `completion_percentage`).
  - Add/remove issues to cycle via `POST/DELETE .../cycles/{cycleId}/issues`.
- **Modules**:
  - Statuses: `backlog` | `in_progress` | `paused` | `completed` | `cancelled`.
  - Lead, dates, aggregate `progress` stats.
  - Add/remove issues via `POST/DELETE .../modules/{moduleId}/issues`.

### 3.10 Attachments & Storage (`/attachments/*`, `/internal/storage/*`)
- Direct presigned upload model:
  1. Frontend calls `POST .../issues/{issueId}/attachments/` with `{ file_name, file_size, mime_type }`.
  2. Backend registers record and returns presigned `{ upload: { url, method, headers } }`.
  3. Frontend uploads directly to presigned URL (`PUT`).
  4. Downloads use presigned `download_url`.

### 3.11 Activity Audit Log & Notifications
- `GET /api/v1/workspaces/{workspaceSlug}/projects/{projectId}/issues/{issueId}/activity/`: Historical log (`action`, `field`, `old_value`, `new_value`, `actor`).
- Notifications:
  - `GET /api/v1/workspaces/{workspaceSlug}/notifications/`: User notifications with `unread_count`.
  - Types: `issue_assigned`, `comment_added`, `mentioned`.
  - `POST .../notifications/read-all` & `POST .../notifications/{id}/read`.

---

## 4. Frontend Architecture & Folder Structure Blueprint

```
app/
├── (auth)/
│   ├── login/page.tsx               # Login screen
│   ├── register/page.tsx            # Register screen (with invite_token support)
│   └── invites/[token]/page.tsx     # Public invite preview & accept action
├── page.tsx                         # Root page: GuestLanding (guests) | WorkspacesPortal (authenticated)
├── profile/page.tsx                 # User profile settings (PATCH /auth/me, logout)
└── [workspaceSlug]/                 # Workspace root & views
    ├── page.tsx                     # Workspace overview / projects dashboard
    ├── settings/                    # Workspace settings & members
    └── [projectId]/
        ├── page.tsx                 # Project board / issues view
        ├── cycles/                  # Agile sprints
        └── modules/                 # Epics & roadmaps
lib/
├── api/                             # Typed API client with auto-refresh interceptors
│   ├── client.ts                    # Browser-side fetch wrapper
│   ├── server.ts                    # Server-side authenticated fetch wrapper
│   └── endpoints/                   # Modular API functions (auth, workspaces, issues, etc.)
├── auth/                            # Auth helpers, session reading, cookie handlers
└── utils.ts                         # Class merging (cn), formatters, date helpers
types/
├── api.ts                           # Domain types (User, Workspace, Project, Issue, State, etc.)
└── dtos.ts                          # Request & response shapes
components/
├── ui/                              # Atomic shadcn / base-ui components
├── widget/                          # AuthedHeader (Workspace switcher with macOS dots, UserMenu)
├── workspaces/                      # WorkspacesPortal, CreateWorkspaceModal, WorkspaceSettingsView
├── projects/                        # ProjectsView (CreateProjectModal, EditProjectModal)
├── issues/                          # KanbanBoard, KanbanCard, CreateIssueModal, IssueDetailModal, kanbanConstants
└── common/                          # MacModal (Traffic light controls: Red blur close, Yellow squeeze close, Green maximize)
```

---

## 5. Core Development Conventions & Agent Instructions

1. **Authentication & Token Handling**:
   - Store `access_token` and `refresh_token` in HTTP-only secure cookies or sync with server actions.
   - For client-side fetch calls, handle 401 status by triggering `/auth/refresh` rotation before retrying.
2. **Next.js 16 Async APIs**:
   - Always `await cookies()` and `await headers()` in Server Actions and Route Handlers.
   - Always treat `params` and `searchParams` in Page/Layout props as Promises:
     ```tsx
     export default async function Page({
       params,
     }: {
       params: Promise<{ workspaceSlug: string; projectId: string }>;
     }) {
       const { workspaceSlug, projectId } = await params;
       // ...
     }
     ```
3. **State Management & UI Performance**:
   - Use Server Components for initial page data loading and SEO.
   - Use Client Components for interactive workflows: Kanban drag-and-drop, real-time filters, issue detail drawers.
   - Implement optimistic updates for status changes, reordering (`sort_order`), and checkbox toggles.
4. **Design Aesthetic & Polish**:
   - Maintain a sleek Linear/Plane-inspired dark aesthetic (`next-themes` dark mode default).
   - Use clean badges for priorities (`urgent`: red, `high`: orange, `medium`: yellow, `low`: blue, `none`: gray).
   - Render state groups with recognizable icons and colored dots.
   - Provide keyboard shortcuts (e.g. `c` for create issue, `Cmd+K` for global search).
5. **Preserve Next.js Agent Block**:
   - Never delete or modify the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of this file.
6. **Design Restraint & Anti-AI Clutter (Minimalist macOS Style)**:
   - **Minimalist macOS Aesthetic**: Maintain a clean, sober, monochrome and minimalist interface. Icons must remain neutral (`text-muted-foreground` / `text-foreground`), without arbitrary colored dots, rainbow accents, or artificial highlights.
   - **Zero AI-slop**: Strictly forbid tacky AI clichés: no rainbow gradient blobs, no oversized cartoon icons, no pseudo-futuristic glowing cards, no unnecessary decorative elements.
   - **Eye-pleasing & Adaptive**: Use comfortable, eye-friendly neutral palettes in both dark and light modes. Every component, modal, and drawer must have a fluid responsive layout adapting gracefully to mobile and desktop displays.
   - **User-Centric Language**: Use simple, respectful, human-oriented copy rather than internal backend jargon (e.g., explain security measures as "потребуется повторно войти в аккаунт" instead of "токены были отозваны бэкендом").

