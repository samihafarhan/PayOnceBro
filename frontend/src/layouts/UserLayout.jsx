import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UrlState } from '../context/AuthContext'

/**
 * UserLayout.jsx
 *
 * This is the "frame" that appears around every user page.
 * It has a top navigation bar with links to Home, Search, Cart, My Orders.
 * Think of it like the border of a picture frame — it stays the same while
 * the picture (the page content) changes inside.
 *
 * Layout: /home, /search, /cart, /orders/:id
 */
const navLinks = [
  { to: '/home', label: '🏠 Home' },
  { to: '/search', label: '🔍 Search' },
  { to: '/cart', label: '🛒 Cart' },
  { to: '/orders', label: '📦 My Orders' },
]

const UserLayout = () => {
  const { user, logout } = UrlState()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <span className="text-lg font-black text-orange-600 tracking-tight">
            PayOnceBro 🛵
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[120px]">
              {user?.full_name ?? user?.email ?? 'User'}
            </span>
            <button
              onClick={async () => {
                try { await logout() } catch { /* best-effort; local session cleared by supabase.signOut */ }
                navigate('/auth')
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content renders here */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default UserLayout