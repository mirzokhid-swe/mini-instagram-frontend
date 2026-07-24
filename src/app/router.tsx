import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { AppLayout } from './layout/AppLayout'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/feed/HomePage'
import { CreatePostPage } from '@/features/post/CreatePostPage'
import { PostDetailPage } from '@/features/post/PostDetailPage'
import { OwnProfilePage } from '@/features/profile/OwnProfilePage'
import { OtherUserProfilePage } from '@/features/profile/OtherUserProfilePage'
import { EditProfilePage } from '@/features/profile/EditProfilePage'
import { SearchPage } from '@/features/search/SearchPage'
import { TagResultsPage } from '@/features/search/TagResultsPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignUpPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/profile" element={<OwnProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/users/:userId" element={<OtherUserProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tags/:tag" element={<TagResultsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
