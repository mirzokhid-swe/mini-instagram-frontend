import { Link } from 'react-router-dom'
import { splitCaption } from '@/lib/hashtag'

export function CaptionText({ username, caption }: { username?: string; caption: string }) {
  const parts = splitCaption(caption)
  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {username && <span className="font-semibold">{username} </span>}
      {parts.map((part, i) =>
        part.tag ? (
          <Link key={i} to={`/tags/${part.tag}`} className="text-primary hover:underline">
            {part.text}
          </Link>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  )
}
