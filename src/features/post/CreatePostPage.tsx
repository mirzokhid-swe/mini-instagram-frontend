import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth'
import * as postsApi from '@/api/posts'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_CAPTION = 2048

export function CreatePostPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => postsApi.createPost(userId!, { caption, image: file! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      toast.success('Post created')
      navigate('/')
    },
    onError: () => toast.error('Could not create the post'),
  })

  function handleFile(selected: File | undefined) {
    if (!selected) return
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setImageError('Only JPEG, PNG, or WEBP images are allowed')
      return
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be at most 10 MB')
      return
    }
    setImageError(null)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setImageError('An image is required')
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="mx-auto w-[600px] py-8">
      <h1 className="mb-6 font-secondary text-2xl font-semibold">Create post</h1>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-secondary/50"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-10 w-10" />
              <p className="text-sm">Click or drag an image here</p>
              <p className="text-xs">JPEG, PNG, WEBP · up to 10 MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {imageError && <p className="mt-2 text-xs text-destructive">{imageError}</p>}

        <div className="mt-4">
          <Textarea
            placeholder="Write a caption…"
            rows={4}
            maxLength={MAX_CAPTION}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {caption.length}/{MAX_CAPTION}
          </p>
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Posting…' : 'Share post'}
        </Button>
      </form>
    </div>
  )
}
