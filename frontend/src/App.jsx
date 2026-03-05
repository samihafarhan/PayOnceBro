
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UrlProvider, UrlState } from './context/AuthContext';

// Auth pages (Member D)
import Auth from './pages/auth/Auth';

// Restaurant pages (Member C)
import RestaurantLayout from './layouts/RestaurantLayout';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import MenuManagement from './pages/restaurant/MenuManagement';

// User pages (Member A)
import UserLayout from './layouts/UserLayout';
import Search from './pages/user/Search';

// Protected route guard (Member D)
import ProtectedRoute from './components/common/ProtectedRoute';
import RiderLayout from './layouts/RiderLayout';
import RiderDashboard from './pages/rider/Dashboard';
import RouteView from './pages/rider/RouteView';
import Earnings from './pages/rider/Earnings';

function App() {
  return (
    <BrowserRouter>
      <UrlProvider>
        <Routes>
          {/* Auth page — Login & Register tabs */}
          <Route path="/" element={<SmartRedirect />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />

          {/* Protected Rider Routes */}
          <Route element={<ProtectedRoute role="rider" />}>
            <Route path="/rider" element={<RiderLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<RiderDashboard />} />
              <Route path="route" element={<RouteView />} />
              <Route path="earnings" element={<Earnings />} />
            </Route>
          </Route>

          {/* User Routes (Member A) */}
          <Route element={<ProtectedRoute role="user" />}>
            <Route element={<UserLayout />}>
              <Route path="/home" element={<Search />} />
              <Route path="/search" element={<Search />} />
              <Route path="/cart" element={<div className="p-10 text-center text-xl text-gray-500 mt-20">🛒 Cart page is under construction (Member A)</div>} />
              <Route path="/orders" element={<div className="p-10 text-center text-xl text-gray-500 mt-20">📦 My Orders page is under construction (Member A)</div>} />
            </Route>
          </Route>

          {/* Restaurant Routes (Member C) */}
          <Route element={<ProtectedRoute role="restaurant_owner" />}>
            <Route path="/restaurant" element={<RestaurantLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<RestaurantDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="reviews" element={<div className="p-10 text-center text-xl text-gray-500 mt-20">⭐ Reviews page is under construction (Member C)</div>} />
            </Route>
          </Route>

          {/* Catch-all for 404s */}
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </UrlProvider>
    </BrowserRouter>
  );
}

export default App;

const SmartRedirect = () => {
  const { user, loading, isSessionLoaded } = UrlState()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || !isSessionLoaded) return
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    const role = user?.role?.trim().toLowerCase()

    // Allow users to reach their dashboard when they hit the root URL
    if (role === 'restaurant_owner' || role === 'restaurant') {
      navigate('/restaurant/dashboard', { replace: true })
    } else if (role === 'rider') {
      navigate('/rider/dashboard', { replace: true })
    } else if (role === 'admin') {
      navigate('/admin/analytics', { replace: true })
    } else {
      navigate('/home', { replace: true }) // default: customer
    }
  }, [user, loading, isSessionLoaded, navigate])

  return null
}
