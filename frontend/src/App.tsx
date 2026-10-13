import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { TasksPage } from './pages/TasksPage'

// Pathless "layout routes" (no `path`) wrap groups of pages: the guards decide
// whether to render their children (via <Outlet />) or redirect, and <Layout>
// adds the sidebar shell around every logged-in page.
export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
