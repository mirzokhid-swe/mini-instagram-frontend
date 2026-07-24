import { apiClient } from './client'
import type { Paginated, ProfilePost, UserProfile, UserSummary } from './types'

export function getUserProfile(_viewerId: number, userId: number): Promise<UserProfile> {
  return apiClient.get<UserProfile>(`/users/${userId}`)
}

export function getUserPosts(userId: number, page: number, perPage = 9): Promise<Paginated<ProfilePost>> {
  return apiClient.get<Paginated<ProfilePost>>(`/users/${userId}/posts`, { page, per_page: perPage })
}

export function getCurrentUser(_userId: number): Promise<UserProfile> {
  return apiClient.get<UserProfile>('/profile')
}

export interface UpdateProfileInput {
  username?: string
  full_name?: string
  bio?: string
  avatar?: File | null
}

export function updateProfile(_userId: number, input: UpdateProfileInput): Promise<null> {
  const form = new FormData()
  form.set('username', input.username ?? '')
  form.set('full_name', input.full_name ?? '')
  form.set('bio', input.bio ?? '')
  if (input.avatar) form.set('avatar', input.avatar)
  return apiClient.putForm<null>('/profile', form)
}

export function follow(_followerId: number, userId: number): Promise<null> {
  return apiClient.post<null>(`/users/${userId}/follow`)
}

export function unfollow(_followerId: number, userId: number): Promise<null> {
  return apiClient.delete<null>(`/users/${userId}/follow`)
}

export function searchUsers(query: string, page: number, perPage = 10): Promise<Paginated<UserSummary>> {
  return apiClient.get<Paginated<UserSummary>>('/search/users', { q: query, page, per_page: perPage })
}
