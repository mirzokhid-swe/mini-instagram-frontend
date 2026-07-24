import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ProfileHeader } from './ProfileHeader'
import { PostsGrid } from '@/components/shared/PostsGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { FollowListDialog } from '@/components/shared/FollowListDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import * as usersApi from '@/api/users'

const PER_PAGE = 9

export function OwnProfilePage() {
  const userId = useAuthStore((s) => s.userId)!
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null)

  const profileQuery = useQuery({
    queryKey: ['userProfile', userId, userId],
    queryFn: () => usersApi.getUserProfile(userId, userId),
  })

  const postsQuery = useInfiniteQuery({
    queryKey: ['userPosts', userId],
    queryFn: ({ pageParam }) => usersApi.getUserPosts(userId, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
  })

  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? []

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
        <ErrorState message="Couldn't load your profile." onRetry={() => profileQuery.refetch()} />
      </div>
    )
  }

  const profile = profileQuery.data

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
        onShowFollowers={() => setFollowDialog('followers')}
        onShowFollowing={() => setFollowDialog('following')}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/profile/edit">Edit Profile</Link>
          </Button>
        }
      />

      {followDialog && (
        <FollowListDialog
          open
          onOpenChange={(open) => !open && setFollowDialog(null)}
          userId={userId}
          mode={followDialog}
        />
      )}

      {posts.length === 0 && !postsQuery.isLoading ? (
        <EmptyState
          title="No posts yet"
          description="Share your first photo to get started."
          action={
            <Button asChild>
              <Link to="/create">Create post</Link>
            </Button>
          }
        />
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
