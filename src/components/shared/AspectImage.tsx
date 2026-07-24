import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface AspectImageProps {
  src: string | undefined
  alt: string
  className?: string
  aspect?: 'square' | 'auto'
}

export function AspectImage({ src, alt, className, aspect = 'square' }: AspectImageProps) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-secondary text-muted-foreground',
          aspect === 'square' && 'aspect-square',
          className,
        )}
      >
        <ImageOff className="h-8 w-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn('bg-secondary object-cover', aspect === 'square' && 'aspect-square', className)}
    />
  )
}
