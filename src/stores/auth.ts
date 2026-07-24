import { create } from 'zustand'
import { clearToken, getToken, setToken, setUnauthorizedHandler, userIdFromToken } from '@/api/client'

interface AuthState {
  token: string | null
  userId: number | null
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  userId: userIdFromToken(getToken()),
  login: (token: string) => {
    setToken(token)
    set({ token, userId: userIdFromToken(token) })
  },
  logout: () => {
    clearToken()
    set({ token: null, userId: null })
  },
}))

setUnauthorizedHandler(() => useAuthStore.getState().logout())
