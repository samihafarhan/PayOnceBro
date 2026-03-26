// frontend/src/components/rider/LocationTracker.jsx
// Background location tracking component
// Mount this once in RiderLayout — it runs silently after mount

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
  const { error } = useRiderLocation()
  const showError = Boolean(error && error.toLowerCase().includes('permission'))

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
