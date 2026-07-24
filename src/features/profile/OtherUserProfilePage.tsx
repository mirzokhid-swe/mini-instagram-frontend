import { Link, Navigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ProfileHeader } from './ProfileHeader'
import { PostsGrid } from '@/components/shared/PostsGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import * as usersApi from '@/api/users'
import type { UserProfile } from '@/api/types'

const PER_PAGE = 9

export function OtherUserProfilePage() {
  const { userId: userIdParam } = useParams<{ userId: string }>()
  const viewerId = useAuthStore((s) => s.userId)!
  const queryClient = useQueryClient()

  const targetId = userIdParam ? Number(userIdParam) : NaN
  const isValidId = Number.isInteger(targetId)

  const profileQuery = useQuery({
    queryKey: ['userProfile', viewerId, targetId],
    queryFn: () => usersApi.getUserProfile(viewerId, targetId),
    enabled: isValidId,
    retry: false,
  })

  const postsQuery = useInfiniteQuery({
    queryKey: ['userPosts', targetId],
    queryFn: ({ pageParam }) => usersApi.getUserPosts(targetId, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
    enabled: isValidId && profileQuery.isSuccess,
  })

  const followMutation = useMutation({
    mutationFn: () =>
      profileQuery.data?.is_following
        ? usersApi.unfollow(viewerId, targetId)
        : usersApi.follow(viewerId, targetId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userProfile', viewerId, targetId] })
      const previous = queryClient.getQueryData<UserProfile>(['userProfile', viewerId, targetId])
      queryClient.setQueryData<UserProfile | undefined>(['userProfile', viewerId, targetId], (old) =>
        old
          ? {
              ...old,
              is_following: !old.is_following,
              followers_count: old.followers_count + (old.is_following ? -1 : 1),
            }
          : old,
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['userProfile', viewerId, targetId], context.previous)
      queryClient.invalidateQueries({ queryKey: ['userProfile', viewerId, targetId] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  if (!isValidId) {
    return (
      <div className="mx-auto w-[800px] py-8">
        <EmptyState
          title="User not found"
          action={
            <Button asChild>
              <Link to="/">Back to feed</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (viewerId === targetId) {
    return <Navigate to="/profile" replace />
  }

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-[800px] py-8">
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto w-[800px] py-8">
        <EmptyState
          title="User not found"
          action={
            <Button asChild>
              <Link to="/">Back to feed</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const profile = profileQuery.data
  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="mx-auto w-[800px] py-8">
      <ProfileHeader
        username={profile.username}
        fullName={profile.full_name}
        bio={profile.bio}
        avatarPath={profile.avatar_path}
        postsCount={profile.posts_count}
        followersCount={profile.followers_count}
        followingCount={profile.following_count}
        action={
          <Button
            variant={profile.is_following ? 'outline' : 'default'}
            size="sm"
            disabled={followMutation.isPending}
            onClick={() => followMutation.mutate()}
          >
            {profile.is_following ? 'Following' : 'Follow'}
          </Button>
        }
      />

      {posts.length === 0 && !postsQuery.isLoading ? (
        <EmptyState title="No posts yet" />
      ) : (
        <PostsGrid
          items={posts}
          hasMore={postsQuery.hasNextPage ?? false}
          onLoadMore={() => postsQuery.fetchNextPage()}
          isLoadingMore={postsQuery.isFetchingNextPage}
        />
      )}
    </div>
  )
}
