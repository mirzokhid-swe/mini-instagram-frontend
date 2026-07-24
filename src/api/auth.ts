import { apiClient } from './client'

export interface SignUpInput {
  email: string
  full_name: string
  username: string
  bio?: string
  password: string
  avatar?: File | null
}

export interface LoginInput {
  email: string
  password: string
}

export async function signUp(input: SignUpInput): Promise<{ access_token: string }> {
  const form = new FormData()
  form.set('email', input.email)
  form.set('full_name', input.full_name)
  form.set('username', input.username)
  form.set('bio', input.bio ?? '')
  form.set('password', input.password)
  if (input.avatar) form.set('avatar', input.avatar)

  return apiClient.postForm<{ access_token: string }>('/auth/sign-up', form)
}

export function login(input: LoginInput): Promise<{ access_token: string }> {
  return apiClient.post<{ access_token: string }>('/auth/login', input)
}

export function logout(): Promise<null> {
  return apiClient.post<null>('/auth/logout')
}
