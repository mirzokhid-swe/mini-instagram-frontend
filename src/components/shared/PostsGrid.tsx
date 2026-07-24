import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AspectImage } from '@/components/shared/AspectImage'
import { mediaUrl } from '@/lib/media'

interface GridItem {
  post_id: number
  thumbnail_path: string
}

export function PostsGrid({
  items,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  items: GridItem[]
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => (
          <Link key={item.post_id} to={`/post/${item.post_id}`}>
            <AspectImage src={mediaUrl(item.thumbnail_path)} alt="" className="w-full" />
          </Link>
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
