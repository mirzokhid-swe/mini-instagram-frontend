import { Link, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/time'
import { useAuthStore } from '@/stores/auth'
import * as notificationsApi from '@/api/notifications'
import type { Notification } from '@/api/types'

const PER_PAGE = 10

const ICONS = { like: Heart, comment: MessageCircle, follow: UserPlus }

function notificationText(notification: Notification): string {
  switch (notification.action_type) {
    case 'like':
      return 'liked your post'
    case 'comment':
      return 'commented on your post'
    case 'follow':
      return 'started following you'
  }
}

function notificationHref(notification: Notification): string | null {
  if (notification.action_type === 'follow') return null
  return `/post/${notification.post_id}`
}

export function NotificationsPage() {
  const userId = useAuthStore((s) => s.userId)!
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const notificationsQuery = useInfiniteQuery({
    queryKey: ['notifications', userId],
    queryFn: ({ pageParam }) => notificationsApi.getNotifications(userId, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.count ? allPages.length + 1 : undefined
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsApi.markNotificationRead(userId, notificationId),
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] })
      queryClient.setQueriesData<{ pages: { items: Notification[]; count: number }[] } | undefined>(
        { queryKey: ['notifications', userId] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.notification_id === notificationId ? { ...item, is_read: true } : item,
              ),
            })),
          }
        },
      )
    },
  })

  function handleClick(notification: Notification) {
    markReadMutation.mutate(notification.notification_id)
    if (notification.action_type === 'follow') navigate(`/users/${notification.actor_id}`)
    else navigate(notificationHref(notification)!)
  }

  const notifications = notificationsQuery.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="mx-auto w-[600px] py-8">
      <h1 className="mb-6 font-secondary text-2xl font-semibold">Notifications</h1>

      {notificationsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!notificationsQuery.isLoading && notifications.length === 0 && (
        <EmptyState title="No notifications yet" description="Likes, comments, and new followers will show up here." />
      )}

      <div className="flex flex-col gap-1">
        {notifications.map((notification) => {
          const Icon = ICONS[notification.action_type]
          return (
            <button
              key={notification.notification_id}
              onClick={() => handleClick(notification)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-secondary',
                !notification.is_read && 'bg-primary/5',
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{notification.actor_username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <Link
                    to={`/users/${notification.actor_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold hover:underline"
                  >
                    {notification.actor_username}
                  </Link>{' '}
                  {notificationText(notification)}
                </p>
                <span className="text-xs text-muted-foreground">{relativeTime(notification.created_at)}</span>
              </div>
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>

      {notificationsQuery.hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notificationsQuery.fetchNextPage()}
            disabled={notificationsQuery.isFetchingNextPage}
          >
            {notificationsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
