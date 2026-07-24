import { Link, useParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PostsGrid } from '@/components/shared/PostsGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import * as searchApi from '@/api/search'

const PER_PAGE = 9

export function TagResultsPage() {
  const { tag } = useParams<{ tag: string }>()
  const cleanTag = (tag ?? '').replace(/^#/, '').toLowerCase()

  const postsQuery = useInfiniteQuery({
    queryKey: ['tagPosts', cleanTag],
    queryFn: ({ pageParam }) => searchApi.getPostsByTag(cleanTag, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
  })

  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? []
  const count = postsQuery.data?.pages[0]?.count ?? 0

  return (
    <div className="mx-auto w-[800px] py-8">
      <h1 className="mb-6 font-secondary text-2xl font-semibold">
        #{cleanTag} · {count} posts
      </h1>

      {postsQuery.isLoading && <Skeleton className="h-64 w-full" />}

      {!postsQuery.isLoading && posts.length === 0 && (
        <EmptyState
          title="No posts found"
          description={`Nobody has posted with #${cleanTag} yet.`}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/search?tab=tags">Search another tag</Link>
            </Button>
          }
        />
      )}

      <PostsGrid
        items={posts}
        hasMore={postsQuery.hasNextPage ?? false}
        onLoadMore={() => postsQuery.fetchNextPage()}
        isLoadingMore={postsQuery.isFetchingNextPage}
        showAuthor
      />
    </div>
  )
}
