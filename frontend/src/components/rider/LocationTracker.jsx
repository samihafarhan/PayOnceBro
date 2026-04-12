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
  useRiderLocation()
  return null
}

export default LocationTracker
