import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UrlProvider } from './context/AuthContext'

// Auth pages (Member D)
import Auth from './pages/auth/Auth'

// Restaurant pages (Member C)
import RestaurantLayout from './layouts/RestaurantLayout'
import Dashboard from './pages/restaurant/Dashboard'
import MenuManagement from './pages/restaurant/MenuManagement'

// Protected route guard (Member D)
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <UrlProvider>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<Auth />} />

          {/* Restaurant routes — Sprint 1 shell */}
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

          {/* Redirect /dashboard → /restaurant/dashboard for post-login nav */}
          <Route path="/dashboard" element={<Navigate to="/restaurant/dashboard" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </UrlProvider>
    </BrowserRouter>
  )
}

export default App
