import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search as SearchIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { mediaUrl } from '@/lib/media'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuthStore } from '@/stores/auth'
import * as searchApi from '@/api/search'
import * as usersApi from '@/api/users'
import type { Paginated, UserSummary } from '@/api/types'

const PER_PAGE = 10

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'tags' ? 'tags' : 'users'
  const navigate = useNavigate()
  const viewerId = useAuthStore((s) => s.userId)!
  const queryClient = useQueryClient()

  const [userQuery, setUserQuery] = useState('')
  const [tagInput, setTagInput] = useState('')
  const debouncedUserQuery = useDebouncedValue(userQuery.trim(), 300)

  const usersQueryKey = ['searchUsers', debouncedUserQuery]

  const usersQuery = useInfiniteQuery({
    queryKey: usersQueryKey,
    queryFn: ({ pageParam }) => searchApi.searchUsers(debouncedUserQuery, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
    enabled: tab === 'users' && debouncedUserQuery.length > 0,
  })

  const users = usersQuery.data?.pages.flatMap((p) => p.items) ?? []

  function setUserFollowing(userId: number, isFollowing: boolean) {
    queryClient.setQueryData<{ pages: Paginated<UserSummary>[]; pageParams: unknown[] } | undefined>(
      usersQueryKey,
      (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((u) => (u.user_id === userId ? { ...u, is_following: isFollowing } : u)),
          })),
        },
    )
  }

  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: number; isFollowing: boolean }) =>
      isFollowing ? usersApi.unfollow(viewerId, userId) : usersApi.follow(viewerId, userId),
    onMutate: async ({ userId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey })
      setUserFollowing(userId, !isFollowing)
    },
    onError: (_err, { userId, isFollowing }) => {
      setUserFollowing(userId, isFollowing)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag) navigate(`/tags/${tag}`)
  }

  return (
    <div className="mx-auto w-[600px] py-8">
      <h1 className="mb-4 font-secondary text-2xl font-semibold">Search</h1>

      <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value })} className="mb-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'users' ? (
        <>
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username or name…"
              className="pl-9"
              maxLength={32}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
          </div>

          {debouncedUserQuery.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Start typing to search for people.
            </p>
          )}

          {debouncedUserQuery.length > 0 && usersQuery.isLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">Searching…</p>
          )}

          {debouncedUserQuery.length > 0 && !usersQuery.isLoading && users.length === 0 && (
            <EmptyState title={`No users found for "${debouncedUserQuery}"`} />
          )}

          <div className="flex flex-col gap-1">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary"
              >
                <Link to={`/users/${user.user_id}`} className="flex flex-1 items-center gap-3">
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
                      followMutation.mutate({ userId: user.user_id, isFollowing: user.is_following })
                    }
                  >
                    {user.is_following ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {usersQuery.hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => usersQuery.fetchNextPage()}
                disabled={usersQuery.isFetchingNextPage}
              >
                {usersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleTagSubmit} className="flex gap-2">
          <Input
            placeholder="Search a hashtag, e.g. travel"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
      )}
    </div>
  )
}
