import { apiClient } from './client'
import type { Notification, Paginated } from './types'

export function getNotifications(_userId: number, page: number, perPage = 10): Promise<Paginated<Notification>> {
  return apiClient.get<Paginated<Notification>>('/notifications', { page, per_page: perPage })
}

export function markNotificationRead(_userId: number, notificationId: number): Promise<null> {
  return apiClient.put<null>(`/notifications/${notificationId}/read`)
}
