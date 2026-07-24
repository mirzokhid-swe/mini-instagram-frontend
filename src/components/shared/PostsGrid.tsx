import { Link } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AspectImage } from '@/components/shared/AspectImage'
import { mediaUrl } from '@/lib/media'

interface GridItem {
  post_id: number
  thumbnail_path: string
  caption: string
  likes_count: number
  comments_count: number
  user_id?: number
  username?: string
  avatar_path?: string
}

export function PostsGrid({
  items,
  hasMore,
  onLoadMore,
  isLoadingMore,
  showAuthor = false,
}: {
  items: GridItem[]
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  showAuthor?: boolean
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.post_id} className="overflow-hidden rounded-lg border bg-card">
            <Link to={`/post/${item.post_id}`}>
              <AspectImage src={mediaUrl(item.thumbnail_path)} alt="" className="w-full" />
            </Link>
            <div className="flex flex-col gap-1.5 p-3">
              {showAuthor && item.username && (
                <Link to={`/users/${item.user_id}`} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={mediaUrl(item.avatar_path)} alt={item.username} />
                    <AvatarFallback>{item.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">{item.username}</span>
                </Link>
              )}
              {item.caption && <p className="line-clamp-2 text-sm text-foreground">{item.caption}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {item.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {item.comments_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-6">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
