import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mediaUrl } from '@/lib/media'

export function ProfileHeader({
  username,
  fullName,
  bio,
  avatarPath,
  postsCount,
  followersCount,
  followingCount,
  action,
}: {
  username: string
  fullName: string
  bio: string
  avatarPath: string
  postsCount: number
  followersCount: number
  followingCount: number
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex items-center gap-10">
      <Avatar className="h-32 w-32">
        <AvatarImage src={mediaUrl(avatarPath)} alt={username} />
        <AvatarFallback className="text-3xl">{username[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div>
        <div className="mb-2 flex items-center gap-4">
          <h1 className="font-secondary text-xl font-semibold">{username}</h1>
          {action}
        </div>
        <div className="mb-3 flex gap-6 text-sm">
          <span>
            <strong>{postsCount}</strong> posts
          </span>
          <span>
            <strong>{followersCount}</strong> followers
          </span>
          <span>
            <strong>{followingCount}</strong> following
          </span>
        </div>
        <p className="text-sm font-medium">{fullName}</p>
        {bio && <p className="max-w-md text-sm text-muted-foreground">{bio}</p>}
      </div>
    </div>
  )
}
