export interface Paginated<T> {
  count: number
  items: T[]
}

export interface UserProfile {
  user_id: number
  username: string
  full_name: string
  bio: string
  avatar_path: string
  posts_count: number
  followers_count: number
  following_count: number
  is_following: boolean
}

export type CurrentUser = UserProfile

export interface UserSummary {
  user_id: number
  username: string
  full_name: string
  avatar_path: string
  is_following: boolean
}

export interface FeedPost {
  user_id: number
  username: string
  post_id: number
  caption: string
  image_path: string
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
}

export interface PostDetail {
  post_id: number
  user_id: number
  username: string
  caption: string
  image_path: string
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
}

export interface ProfilePost {
  post_id: number
  thumbnail_path: string
  caption: string
  likes_count: number
  comments_count: number
  created_at: string
}

export interface TagPost {
  post_id: number
  user_id: number
  username: string
  thumbnail_path: string
  caption: string
  likes_count: number
  comments_count: number
  created_at: string
}

export interface Comment {
  comment_id: number
  post_id: number
  user_id: number
  username: string
  content: string
  created_at: string
}

export type NotificationActionType = 'like' | 'comment' | 'follow'

// Flat shape as returned by GET /notifications — no nested actor/post/comment objects.
export interface Notification {
  notification_id: number
  action_type: NotificationActionType
  actor_id: number
  actor_username: string
  post_id: number
  is_read: boolean
  created_at: string
}

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  description: string
  fieldErrors: FieldError[]

  constructor(status: number, description: string, fieldErrors: FieldError[] = []) {
    super(description)
    this.status = status
    this.description = description
    this.fieldErrors = fieldErrors
  }
}
