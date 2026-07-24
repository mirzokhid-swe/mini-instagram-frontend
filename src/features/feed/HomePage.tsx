import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PostCard } from './PostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import * as postsApi from '@/api/posts'

const PER_PAGE = 10

export function HomePage() {
  const userId = useAuthStore((s) => s.userId)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ['feed', userId],
    queryFn: ({ pageParam }) => postsApi.getFeed(userId!, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
    enabled: userId !== null,
  })

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const posts = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="mx-auto w-[600px] py-8">
      {isLoading && (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="aspect-square w-full" />
            </div>
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load your feed." onRetry={() => refetch()} />}

      {!isLoading && !isError && posts.length === 0 && (
        <EmptyState
          title="Your feed is empty"
          description="Find people to follow to see their posts here."
          action={
            <Button asChild>
              <Link to="/search">Find people</Link>
            </Button>
          }
        />
      )}

      {posts.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && <Skeleton className="h-8 w-24" />}
        </div>
      )}
    </div>
  )
}
