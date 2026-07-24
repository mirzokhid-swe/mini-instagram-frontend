import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/api/users'
import { useAuthStore } from '@/stores/auth'

export function useCurrentUser() {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['currentUser', userId],
    queryFn: () => getCurrentUser(userId!),
    enabled: userId !== null,
  })
}
