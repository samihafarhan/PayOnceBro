import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UrlProvider, UrlState } from './context/AuthContext';

// Auth pages (Member D)
import Auth from './pages/auth/Auth';

// Restaurant pages (Member C)
import RestaurantLayout from './layouts/RestaurantLayout';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import MenuManagement from './pages/restaurant/MenuManagement';
import RestaurantReviews from './pages/restaurant/Reviews';

// User pages (Member A)
import UserLayout from './layouts/UserLayout';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import RestaurantProfile from './pages/user/RestaurantProfile';
import Cart from './pages/user/Cart';
import Orders from './pages/user/Orders';

// Protected route guard (Member D)
import ProtectedRoute from './components/common/ProtectedRoute';
import RiderLayout from './layouts/RiderLayout';
import RiderDashboard from './pages/rider/Dashboard';
import RouteView from './pages/rider/RouteView';
import Earnings from './pages/rider/Earnings';
import AdminLayout from './layouts/AdminLayout';
import Analytics from './pages/admin/Analytics';

import { Toaster } from './components/ui/sonner';
import OrderTracking from './pages/user/OrderTracking';

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
              <Route path="/home" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/restaurants/:id" element={<RestaurantProfile />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
            </Route>
          </Route>

          {/* Admin Routes (Member D) */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="analytics" replace />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Restaurant Routes (Member C) */}
          <Route element={<ProtectedRoute role="restaurant_owner" />}>
            <Route path="/restaurant" element={<RestaurantLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<RestaurantDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="reviews" element={<RestaurantReviews />} />
            </Route>
          </Route>

          {/* Catch-all for 404s */}
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
        <Toaster position="top-right" richColors />
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

    if (role === 'restaurant_owner' || role === 'restaurant') {
      navigate('/restaurant/dashboard', { replace: true })
    } else if (role === 'rider') {
      navigate('/rider/dashboard', { replace: true })
    } else if (role === 'admin') {
      navigate('/admin/analytics', { replace: true })
    } else {
      navigate('/home', { replace: true })
    }
  }, [user, loading, isSessionLoaded, navigate])

  if (loading || !isSessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <p className="text-sm font-medium">Loading session...</p>
      </div>
    )
  }

  return null
}