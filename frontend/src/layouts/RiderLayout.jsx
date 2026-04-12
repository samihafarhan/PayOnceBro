import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNavbar from '../components/common/TopNavbar'
import LocationTracker from '../components/rider/LocationTracker.jsx'

const navLinks = [
  { to: '/rider/dashboard', label: 'Dashboard' },
  { to: '/rider/route', label: 'Route' },
  { to: '/rider/earnings', label: 'Earnings' },
]

const RiderLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar title="PayOnce Rider" links={navLinks} />
      <LocationTracker />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default RiderLayout
