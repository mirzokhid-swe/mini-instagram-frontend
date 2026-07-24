import { apiClient } from './client'
import type { FeedPost, Paginated, PostDetail } from './types'

export function getFeed(_viewerId: number, page: number, perPage = 10): Promise<Paginated<FeedPost>> {
  return apiClient.get<Paginated<FeedPost>>('/feed', { page, per_page: perPage })
}

export interface CreatePostInput {
  caption: string
  image: File
}

export function createPost(_userId: number, input: CreatePostInput): Promise<null> {
  const form = new FormData()
  form.set('caption', input.caption)
  form.set('image', input.image)
  return apiClient.postForm<null>('/post', form)
}

export function getPost(_viewerId: number, postId: number): Promise<PostDetail> {
  return apiClient.get<PostDetail>(`/post/${postId}`)
}

export function likePost(_viewerId: number, postId: number): Promise<null> {
  return apiClient.post<null>(`/post/${postId}/like`)
}

export function unlikePost(_viewerId: number, postId: number): Promise<null> {
  return apiClient.delete<null>(`/post/${postId}/like`)
}

export function deletePost(_userId: number, postId: number): Promise<null> {
  return apiClient.delete<null>(`/post/${postId}`)
}

export function editPost(_userId: number, postId: number, caption: string): Promise<null> {
  return apiClient.put<null>(`/post/${postId}`, { caption })
}
