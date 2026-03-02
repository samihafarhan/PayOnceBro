import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UrlProvider } from './context/AuthContext'

// Auth pages (Member D)
import Auth from './pages/auth/Auth'

// Restaurant pages (Member C)
import RestaurantLayout from './layouts/RestaurantLayout'
import Dashboard from './pages/restaurant/Dashboard'
import MenuManagement from './pages/restaurant/MenuManagement'

// User pages (Member A) ← NEW
import UserLayout from './layouts/UserLayout'
import Search from './pages/user/Search'

// Protected route guard (Member D)
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <UrlProvider>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<Auth />} />

          {/* ── USER ROUTES (Member A) ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            {/* /home — placeholder for now, Sprint 2 will fill it */}
            <Route
              path="home"
              element={
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                  <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to PayOnceBro! 🛵</h1>
                  <p className="text-gray-500">Use the Search tab to find food.</p>
                </div>
              }
            />
            {/* /search — the Smart Food Search page we just built! */}
            <Route path="search" element={<Search />} />
            {/* /cart — placeholder for Sprint 3 */}
            <Route
              path="cart"
              element={
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                  <span className="text-5xl">🛒</span>
                  <h2 className="mt-4 text-2xl font-bold text-gray-700">Cart — Coming in Sprint 3</h2>
                </div>
              }
            />
            {/* /orders — placeholder for Sprint 3 */}
            <Route
              path="orders"
              element={
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                  <span className="text-5xl">📦</span>
                  <h2 className="mt-4 text-2xl font-bold text-gray-700">My Orders — Coming in Sprint 3</h2>
                </div>
              }
            />
          </Route>

          {/* ── RESTAURANT ROUTES (Member C) ── */}
          <Route
            path="/restaurant"
            element={
              <ProtectedRoute>
                <RestaurantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="reviews" element={<div className="p-6 text-gray-500">Reviews — coming soon</div>} />
          </Route>

          {/* Smart redirect after login — sends each role to their dashboard */}
          <Route path="/dashboard" element={<SmartRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </UrlProvider>
    </BrowserRouter>
  )
}

/**
 * SmartRedirect — checks the logged-in user's role and sends them
 * to the correct dashboard. Called right after login.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UrlState } from './context/AuthContext'

const SmartRedirect = () => {
  const { user, loading } = UrlState()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/auth')
      return
    }
    const role = user.role
    if (role === 'restaurant_owner') navigate('/restaurant/dashboard', { replace: true })
    else if (role === 'rider') navigate('/rider/dashboard', { replace: true })
    else if (role === 'admin') navigate('/admin/analytics', { replace: true })
    else navigate('/home', { replace: true }) // default: customer
  }, [user, loading, navigate])

  return null
}

export default App