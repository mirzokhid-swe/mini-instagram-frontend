import { Link } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AspectImage } from '@/components/shared/AspectImage'
import { CaptionText } from '@/components/shared/CaptionText'
import { cn } from '@/lib/cn'
import { mediaUrl } from '@/lib/media'
import { relativeTime } from '@/lib/time'
import { useAuthStore } from '@/stores/auth'
import * as postsApi from '@/api/posts'
import type { FeedPost } from '@/api/types'

export function PostCard({ post }: { post: FeedPost }) {
  const userId = useAuthStore((s) => s.userId)
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => postsApi.likePost(userId!, post.post_id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previous = queryClient.getQueriesData<{ pages: { items: FeedPost[]; count: number }[] }>({ queryKey: ['feed'] })
      queryClient.setQueriesData<{ pages: { items: FeedPost[]; count: number }[]; pageParams: unknown[] } | undefined>(
        { queryKey: ['feed'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.post_id === post.post_id ? { ...item, is_liked: true, likes_count: item.likes_count + 1 } : item,
              ),
            })),
          }
        },
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Could not like the post')
    },
  })

  const isLiked = post.is_liked

  function handleLike() {
    if (isLiked || likeMutation.isPending) return
    likeMutation.mutate()
  }

  return (
    <article className="mb-6 rounded-lg border border-border bg-card">
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{post.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <Link to={`/users/${post.user_id}`} className="text-sm font-semibold hover:underline">
          {post.username}
        </Link>
        <span className="ml-auto text-xs text-muted-foreground">{relativeTime(post.created_at)}</span>
      </header>

      <AspectImage src={mediaUrl(post.image_path)} alt={post.caption} className="w-full" />

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm"
          aria-label={isLiked ? 'Liked' : 'Like'}
        >
          <Heart className={cn('h-5 w-5', isLiked ? 'fill-primary text-primary' : 'text-foreground')} />
          <span>{post.likes_count}</span>
        </button>
        <Link to={`/post/${post.post_id}`} className="flex items-center gap-1.5 text-sm">
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments_count}</span>
        </Link>
      </div>

      {post.caption && (
        <div className="px-4 py-3">
          <CaptionText username={post.username} caption={post.caption} />
        </div>
      )}
    </article>
  )
}
