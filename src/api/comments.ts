import { apiClient } from './client'
import type { Comment, Paginated } from './types'

export function getComments(postId: number, page: number, perPage = 10): Promise<Paginated<Comment>> {
  return apiClient.get<Paginated<Comment>>(`/post/${postId}/comments`, { page, per_page: perPage })
}

export function addComment(_userId: number, postId: number, content: string): Promise<null> {
  return apiClient.post<null>(`/post/${postId}/comments`, { content })
}

export function deleteComment(_userId: number, commentId: number): Promise<null> {
  return apiClient.delete<null>(`/comments/${commentId}`)
}

export function editComment(_userId: number, commentId: number, content: string): Promise<null> {
  return apiClient.put<null>(`/comments/${commentId}`, { content })
}
