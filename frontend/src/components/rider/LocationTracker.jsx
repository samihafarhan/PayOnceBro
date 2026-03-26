// frontend/src/components/rider/LocationTracker.jsx
// Background location tracking component
// Mount this once in RiderLayout — it runs silently after mount

import { useEffect, useState } from 'react'
import useRiderLocation from '../../hooks/useRiderLocation.js'

/**
 * LocationTracker — Silent background component for continuous GPS tracking.
 * 
 * This component:
 * - Initializes geolocation tracking on mount
 * - Syncs location to backend every 30 seconds
 * - Shows a discrete notification if permission is denied
 * - Must be mounted once per rider session (typically at the layout level)
 * 
 * Props: none
 * 
 * Usage (in RiderLayout.jsx):
 *   <LocationTracker />
 */
const LocationTracker = () => {
  const { lat, lng, error, isTracking } = useRiderLocation()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error && error.includes('permission')) {
      // Only show the error if geolocation was denied
      setShowError(true)

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Silent component — only renders error notification if needed
  if (!showError) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-xs p-4 bg-yellow-50 border border-yellow-200 rounded shadow-sm">
      <p className="text-sm text-yellow-700">
        <span className="font-semibold">Location Disabled:</span> Please enable location
        access in your device settings to share your position with customers.
      </p>
    </div>
  )
}

export default LocationTracker
