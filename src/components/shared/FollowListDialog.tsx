import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import * as usersApi from '@/api/users'
import type { Paginated, UserSummary } from '@/api/types'

const PER_PAGE = 20

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  mode: 'followers' | 'following'
}) {
  const viewerId = useAuthStore((s) => s.userId)!
  const queryClient = useQueryClient()
  const queryKey = ['followList', mode, userId]

  const listQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      mode === 'followers'
        ? usersApi.getFollowers(userId, pageParam, PER_PAGE)
        : usersApi.getFollowing(userId, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
    enabled: open,
  })

  const users = listQuery.data?.pages.flatMap((p) => p.items) ?? []

  function setUserFollowing(targetId: number, isFollowing: boolean) {
    queryClient.setQueryData<{ pages: Paginated<UserSummary>[]; pageParams: unknown[] } | undefined>(
      queryKey,
      (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((u) => (u.user_id === targetId ? { ...u, is_following: isFollowing } : u)),
          })),
        },
    )
  }

  const followMutation = useMutation({
    mutationFn: ({ targetId, isFollowing }: { targetId: number; isFollowing: boolean }) =>
      isFollowing ? usersApi.unfollow(viewerId, targetId) : usersApi.follow(viewerId, targetId),
    onMutate: async ({ targetId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey })
      setUserFollowing(targetId, !isFollowing)
    },
    onError: (_err, { targetId, isFollowing }) => {
      setUserFollowing(targetId, isFollowing)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] max-w-[420px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
        </DialogHeader>

        {listQuery.isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}

        {!listQuery.isLoading && users.length === 0 && (
          <EmptyState title={mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'} />
        )}

        <div className="flex flex-col gap-1">
          {users.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary"
            >
              <Link
                to={`/users/${user.user_id}`}
                onClick={() => onOpenChange(false)}
                className="flex flex-1 items-center gap-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={mediaUrl(user.avatar_path)} alt={user.username} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.full_name}</p>
                </div>
              </Link>
              {user.user_id !== viewerId && (
                <Button
                  variant={user.is_following ? 'outline' : 'default'}
                  size="sm"
                  disabled={followMutation.isPending}
                  onClick={() =>
                    followMutation.mutate({ targetId: user.user_id, isFollowing: user.is_following })
                  }
                >
                  {user.is_following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          ))}
        </div>

        {listQuery.hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.fetchNextPage()}
              disabled={listQuery.isFetchingNextPage}
            >
              {listQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
