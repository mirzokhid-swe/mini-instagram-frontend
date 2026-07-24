import { apiClient } from './client'
import type { Paginated, TagPost, UserSummary } from './types'

export function searchUsers(query: string, page: number, perPage = 10): Promise<Paginated<UserSummary>> {
  return apiClient.get<Paginated<UserSummary>>('/search/users', { q: query, page, per_page: perPage })
}

export function getPostsByTag(tag: string, page: number, perPage = 9): Promise<Paginated<TagPost>> {
  return apiClient.get<Paginated<TagPost>>('/search/posts', { tag, page, per_page: perPage })
}
