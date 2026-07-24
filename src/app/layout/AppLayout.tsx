import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Bell, PlusSquare, User, LogOut, Moon, Sun } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { Toaster } from '@/components/ui/sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { mediaUrl } from '@/lib/media'
import { getNotifications } from '@/api/notifications'
import * as authApi from '@/api/auth'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/create', label: 'Create', icon: PlusSquare, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
]

export function AppLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const userId = useAuthStore((s) => s.userId)
  const { theme, toggleTheme } = useThemeStore()
  const { data: currentUser } = useCurrentUser()

  const { data: notificationsPage } = useQuery({
    queryKey: ['notifications', userId, 1, 'unread-check'],
    queryFn: () => getNotifications(userId!, 1),
    enabled: userId !== null,
  })
  const hasUnread = notificationsPage?.items.some((n) => !n.is_read) ?? false

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex h-screen w-screen min-w-[1440px] overflow-hidden bg-background text-foreground">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6">
        <div className="mb-8 px-2 font-secondary text-2xl font-bold text-foreground">Lumen</div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary',
                  isActive && 'bg-secondary',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.label === 'Notifications' && hasUnread && (
                <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="mb-3 flex items-center gap-2 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={mediaUrl(currentUser?.avatar_path)} alt={currentUser?.username} />
            <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{currentUser?.username}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-secondary"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
