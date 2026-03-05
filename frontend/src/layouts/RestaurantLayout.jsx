import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UrlState } from '../context/AuthContext'

const navLinks = [
  { to: '/restaurant/dashboard', label: 'Orders' },
  { to: '/restaurant/menu', label: 'Menu' },
  { to: '/restaurant/reviews', label: 'Reviews' },
]

const RestaurantLayout = () => {
  const { user, logout } = UrlState()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">PayOnceBro</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {user?.email ?? 'Restaurant'}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={async () => {
              try { await logout() } catch { /* best-effort */ }
              navigate('/auth')
            }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default RestaurantLayout
