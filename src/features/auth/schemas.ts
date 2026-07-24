import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().min(1, 'Email is required').max(128, 'Email is too long').email('Enter a valid email'),
  full_name: z.string().min(1, 'Full name is required').max(64, 'Full name is too long'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username is too long')
    .regex(/^[a-z0-9_.]+$/, 'Only lowercase letters, numbers, "_" and "." are allowed'),
  bio: z.string().max(512, 'Bio is too long').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long'),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
