import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Heart, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/api/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AspectImage } from '@/components/shared/AspectImage'
import { CaptionText } from '@/components/shared/CaptionText'
import { EmptyState } from '@/components/shared/EmptyState'
import { CommentList } from './CommentList'
import { cn } from '@/lib/cn'
import { mediaUrl } from '@/lib/media'
import { relativeTime } from '@/lib/time'
import { useAuthStore } from '@/stores/auth'
import * as postsApi from '@/api/posts'
import * as commentsApi from '@/api/comments'

const COMMENTS_PER_PAGE = 10
const MAX_CAPTION = 2048

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const parsedId = postId ? Number(postId) : NaN
  const isValidId = Number.isInteger(parsedId)

  const postQuery = useQuery({
    queryKey: ['post', parsedId],
    queryFn: () => postsApi.getPost(userId!, parsedId),
    enabled: isValidId && userId !== null,
    retry: false,
  })

  const commentsQuery = useInfiniteQuery({
    queryKey: ['comments', parsedId],
    queryFn: ({ pageParam }) => commentsApi.getComments(parsedId, pageParam, COMMENTS_PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
    enabled: isValidId && postQuery.isSuccess,
  })

  const likeMutation = useMutation({
    mutationFn: () => (post?.is_liked ? postsApi.unlikePost(userId!, parsedId) : postsApi.likePost(userId!, parsedId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', parsedId] })
      const previous = queryClient.getQueryData(['post', parsedId])
      queryClient.setQueryData(['post', parsedId], (old: typeof post) =>
        old ? { ...old, is_liked: !old.is_liked, likes_count: old.likes_count + (old.is_liked ? -1 : 1) } : old,
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['post', parsedId], context.previous)
      queryClient.invalidateQueries({ queryKey: ['post', parsedId] })
    },
  })

  const editMutation = useMutation({
    mutationFn: () => postsApi.editPost(userId!, parsedId, editCaption.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', parsedId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      setEditOpen(false)
      toast.success('Caption updated')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        setEditError(err.fieldErrors[0].message)
      } else {
        toast.error('Could not update caption')
      }
    },
  })

  function openEdit() {
    setEditCaption(post?.caption ?? '')
    setEditError(null)
    setEditOpen(true)
  }

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(userId!, parsedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      toast.success('Post deleted')
      navigate('/profile')
    },
    onError: () => toast.error('Could not delete the post'),
  })

  if (!isValidId || postQuery.isError) {
    return (
      <div className="mx-auto w-[600px] py-8">
        <EmptyState
          title="Post not found"
          description="This post may have been deleted or never existed."
          action={
            <Button asChild>
              <Link to="/">Back to feed</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const post = postQuery.data
  const comments = commentsQuery.data?.pages.flatMap((p) => p.items) ?? []
  const isOwner = post && userId === post.user_id

  return (
    <div className="mx-auto flex w-[900px] gap-0 py-8">
      <div className="flex w-[1050px] max-w-full overflow-hidden rounded-lg border border-border bg-card">
        <div className="w-[550px] shrink-0 bg-secondary">
          {post ? (
            <AspectImage src={mediaUrl(post.image_path)} alt={post.caption} className="h-full w-full" />
          ) : (
            <Skeleton className="aspect-square w-full" />
          )}
        </div>

        <div className="flex w-[400px] flex-col">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            {post ? (
              <>
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{post.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link to={`/users/${post.user_id}`} className="text-sm font-semibold hover:underline">
                  {post.username}
                </Link>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Post options">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={openEdit}>Edit caption</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
                        Delete post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
          </header>

          {post && (
            <div className="border-b border-border px-4 py-3">
              <CaptionText username={post.username} caption={post.caption} />
              <span className="mt-1 block text-xs text-muted-foreground">{relativeTime(post.created_at)}</span>
            </div>
          )}

          {post && (
            <div className="flex items-center gap-4 border-b border-border px-4 py-3">
              <button
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className="flex items-center gap-1.5 text-sm"
              >
                <Heart className={cn('h-5 w-5', post.is_liked ? 'fill-primary text-primary' : 'text-foreground')} />
                <span>{post.likes_count}</span>
              </button>
              <span className="text-sm text-muted-foreground">{post.comments_count} comments</span>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {post && (
              <CommentList
                postId={post.post_id}
                postAuthorId={post.user_id}
                comments={comments}
                hasMore={commentsQuery.hasNextPage ?? false}
                onLoadMore={() => commentsQuery.fetchNextPage()}
                isLoadingMore={commentsQuery.isFetchingNextPage}
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit caption</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={MAX_CAPTION}
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">
            {editCaption.length}/{MAX_CAPTION}
          </p>
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled={editMutation.isPending} onClick={() => editMutation.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
