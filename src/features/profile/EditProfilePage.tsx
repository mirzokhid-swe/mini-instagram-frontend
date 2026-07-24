import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { mediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import * as usersApi from '@/api/users'
import { ApiError } from '@/api/types'

const editProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username is too long')
    .regex(/^[a-z0-9_.]+$/, 'Only lowercase letters, numbers, "_" and "." are allowed'),
  full_name: z.string().min(1, 'Full name is required').max(64, 'Full name is too long'),
  bio: z.string().max(512, 'Bio is too long').optional().or(z.literal('')),
})
type EditProfileValues = z.infer<typeof editProfileSchema>

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function EditProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)!
  const { data: currentUser } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    values: currentUser
      ? { username: currentUser.username, full_name: currentUser.full_name, bio: currentUser.bio }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: EditProfileValues) =>
      usersApi.updateProfile(userId, { ...values, avatar: avatarFile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      toast.success('Profile updated')
      navigate('/profile')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        for (const fieldError of err.fieldErrors) {
          setError(fieldError.field as keyof EditProfileValues, { message: fieldError.message })
        }
      } else {
        toast.error('Could not update profile')
      }
    },
  })

  function handleAvatarPick(file: File | undefined) {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, or WEBP images are allowed')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Avatar must be at most 5 MB')
      return
    }
    setAvatarError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  return (
    <div className="mx-auto w-[520px] py-8">
      <h1 className="mb-6 font-secondary text-2xl font-semibold">Edit profile</h1>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
            aria-label="Change avatar"
          >
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview ?? mediaUrl(currentUser?.avatar_path)} alt={currentUser?.username} />
              <AvatarFallback className="text-2xl">{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleAvatarPick(e.target.files?.[0])}
          />
          {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register('username')} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} {...register('bio')} />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
