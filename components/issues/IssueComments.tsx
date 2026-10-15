"use client"

import * as React from "react"
import {
  CornerDownRight,
  Edit2,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DeleteCommentModal } from "./DeleteCommentModal"
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/redux/api/commentApi"
import { useGetMeQuery } from "@/redux/api/authApi"
import { getAuthErrorMessage } from "@/lib/auth/errorHandler"
import type { IssueComment } from "@/types/api"

interface IssueCommentsProps {
  workspaceSlug: string
  projectId: string
  issueId: string
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return "только что"
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} ч. назад`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} дн. назад`

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })
  } catch {
    return dateStr
  }
}

export function IssueComments({
  workspaceSlug,
  projectId,
  issueId,
}: IssueCommentsProps) {
  const { data: me } = useGetMeQuery()
  const { data: comments = [], isLoading } = useGetCommentsQuery({
    workspaceSlug,
    projectId,
    issueId,
  })

  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation()
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation()
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation()

  const [newCommentBody, setNewCommentBody] = React.useState("")
  const [replyingTo, setReplyingTo] = React.useState<IssueComment | null>(null)
  const [replyBody, setReplyBody] = React.useState("")
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null)
  const [editBody, setEditBody] = React.useState("")
  const [deletingComment, setDeletingComment] = React.useState<IssueComment | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Separate root comments and child replies
  const rootComments = React.useMemo(
    () => comments.filter((c) => !c.parent_comment_id && !c.deleted_at),
    [comments]
  )

  const repliesByParent = React.useMemo(() => {
    const map = new Map<string, IssueComment[]>()
    for (const c of comments) {
      if (c.parent_comment_id && !c.deleted_at) {
        const existing = map.get(c.parent_comment_id) || []
        existing.push(c)
        map.set(c.parent_comment_id, existing)
      }
    }
    return map
  }, [comments])

  const handleCreateRoot = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCommentBody.trim()
    if (!trimmed) return
    setErrorMessage(null)

    try {
      await createComment({
        workspaceSlug,
        projectId,
        issueId,
        body: trimmed,
      }).unwrap()
      setNewCommentBody("")
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyingTo) return
    const trimmed = replyBody.trim()
    if (!trimmed) return
    setErrorMessage(null)

    try {
      await createComment({
        workspaceSlug,
        projectId,
        issueId,
        body: trimmed,
        parent_comment_id: replyingTo.id,
      }).unwrap()
      setReplyBody("")
      setReplyingTo(null)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editBody.trim()
    if (!trimmed) return
    setErrorMessage(null)

    try {
      await updateComment({
        workspaceSlug,
        projectId,
        issueId,
        commentId,
        body: trimmed,
      }).unwrap()
      setEditingCommentId(null)
      setEditBody("")
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const handleDelete = (comment: IssueComment) => {
    setDeletingComment(comment)
  }

  const handleConfirmDelete = async () => {
    if (!deletingComment) return
    setErrorMessage(null)
    try {
      await deleteComment({
        workspaceSlug,
        projectId,
        issueId,
        commentId: deletingComment.id,
      }).unwrap()
      setDeletingComment(null)
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err))
    }
  }

  const renderComment = (comment: IssueComment, isChild = false) => {
    const isAuthor = me?.id === comment.author_id
    const isEditing = editingCommentId === comment.id
    const childReplies = repliesByParent.get(comment.id) || []

    return (
      <div
        key={comment.id}
        className={`group space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs transition-colors ${
          isChild ? "ml-6 sm:ml-8 border-l-2 border-l-border" : ""
        }`}
      >
        {/* Comment Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-5 border border-border">
              {comment.author?.avatar_url && (
                <AvatarImage
                  src={comment.author.avatar_url}
                  alt={comment.author.display_name}
                />
              )}
              <AvatarFallback className="text-[10px] font-medium">
                {(comment.author?.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {comment.author?.display_name || "Пользователь"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          {/* Action buttons (Reply / Edit / Delete) */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {!isChild && (
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(comment)
                  setReplyBody("")
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                title="Ответить"
              >
                <CornerDownRight className="size-3" />
                <span>Ответить</span>
              </button>
            )}

            {isAuthor && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommentId(comment.id)
                    setEditBody(comment.body)
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                  title="Редактировать"
                >
                  <Edit2 className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(comment)}
                  disabled={isDeleting}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Удалить"
                >
                  <Trash2 className="size-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comment Body or Edit input */}
        {isEditing ? (
          <div className="space-y-2 pt-1">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              disabled={isUpdating}
              rows={2}
              className="w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-ring resize-y"
            />
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveEdit(comment.id)}
                disabled={isUpdating}
                className="h-7 px-2.5 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 cursor-pointer"
              >
                {isUpdating ? <Loader2 className="size-3 animate-spin" /> : "Сохранить"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCommentId(null)
                  setEditBody("")
                }}
                className="h-7 px-2 text-xs cursor-pointer"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap pl-7">
            {comment.body}
          </p>
        )}

        {/* Inline reply form if this comment is being replied to */}
        {replyingTo?.id === comment.id && (
          <form
            onSubmit={handleCreateReply}
            className="mt-3 ml-7 space-y-2 rounded-lg border border-border bg-card p-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Ответ для {comment.author?.display_name || "пользователя"}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Напишите ответ..."
              rows={2}
              autoFocus
              disabled={isCreating}
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs outline-hidden focus:ring-1 focus:ring-ring resize-y"
            />
            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-7 px-2 text-xs cursor-pointer"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !replyBody.trim()}
                className="h-7 px-3 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 gap-1 cursor-pointer"
              >
                {isCreating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>Ответить</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Child comments list */}
        {childReplies.length > 0 && (
          <div className="space-y-2 pt-1">
            {childReplies.map((child) => renderComment(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      {/* New Root Comment Form */}
      <form onSubmit={handleCreateRoot} className="space-y-2">
        <div className="relative">
          <textarea
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            placeholder="Оставить комментарий к задаче..."
            disabled={isCreating}
            rows={3}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs sm:text-sm outline-hidden focus:ring-1 focus:ring-ring resize-y placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isCreating || !newCommentBody.trim()}
            className="h-8 px-3.5 text-xs bg-foreground text-background font-medium hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Отправка...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Комментировать</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-2.5 pt-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-1.5 border border-dashed border-border/70 rounded-lg bg-muted/10">
            <MessageSquare className="size-5 text-muted-foreground/60" />
            <p className="text-xs font-medium">Нет комментариев</p>
            <p className="text-[11px]">Будьте первым, кто начнет обсуждение этой задачи</p>
          </div>
        ) : (
          rootComments.map((root) => renderComment(root, false))
        )}
      </div>

      <DeleteCommentModal
        isOpen={!!deletingComment}
        onClose={() => setDeletingComment(null)}
        onConfirm={handleConfirmDelete}
        commentSnippet={deletingComment?.body}
        isLoading={isDeleting}
      />
    </div>
  )
}
