import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNavbar from '../components/common/TopNavbar'

const navLinks = [
  { to: '/home', label: '🏠 Home' },
  { to: '/search', label: '🔍 Search' },
  { to: '/cart', label: '🛒 Cart' },
  { to: '/orders', label: '📦 My Orders' },
]

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar title="PayOnceBro 🛵" links={navLinks} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default UserLayout
