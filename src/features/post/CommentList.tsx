import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { relativeTime } from '@/lib/time'
import { useAuthStore } from '@/stores/auth'
import * as commentsApi from '@/api/comments'
import type { Comment } from '@/api/types'

const MAX_CONTENT = 2048

export function CommentList({
  postId,
  postAuthorId,
  comments,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  postId: number
  postAuthorId: number
  comments: Comment[]
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
}) {
  const userId = useAuthStore((s) => s.userId)
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const addMutation = useMutation({
    mutationFn: () => commentsApi.addComment(userId!, postId, content.trim()),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: () => toast.error('Could not post comment'),
  })

  const editMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.editComment(userId!, commentId, editContent.trim()),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
    onError: () => toast.error('Could not update comment'),
  })

  function startEdit(comment: Comment) {
    setEditingId(comment.comment_id)
    setEditContent(comment.content)
  }

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(userId!, commentId),
    onSuccess: () => {
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: () => {
      toast.error('Comment already removed, refreshing…')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    addMutation.mutate()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {comments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>}

        {comments.map((comment) => {
          const canModify = userId === comment.user_id || userId === postAuthorId
          const isEditing = editingId === comment.comment_id
          return (
            <div key={comment.comment_id} className="group flex gap-3 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-1.5">
                    <Input
                      autoFocus
                      maxLength={MAX_CONTENT}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!editContent.trim() || editMutation.isPending}
                        onClick={() => editMutation.mutate(comment.comment_id)}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      <span className="font-semibold">{comment.username} </span>
                      {comment.content}
                    </p>
                    <span className="text-xs text-muted-foreground">{relativeTime(comment.created_at)}</span>
                  </>
                )}
              </div>
              {canModify && !isEditing && (
                <div className="flex shrink-0 items-start gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {userId === comment.user_id && (
                    <button
                      onClick={() => startEdit(comment)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Edit comment"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(comment)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {hasMore && (
          <div className="flex justify-center py-2">
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          placeholder="Add a comment…"
          maxLength={MAX_CONTENT}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" disabled={!content.trim() || addMutation.isPending}>
          Post
        </Button>
      </form>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete comment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.comment_id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
