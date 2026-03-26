// frontend/src/hooks/useRiderLocation.js
// Custom hook for geolocation + periodic backend sync

import { useEffect, useRef, useCallback, useState } from 'react'
import { updateLocation } from '../services/riderService.js'

/**
 * useRiderLocation — Tracks rider's GPS location and syncs to backend every 30s.
 * 
 * Behavior:
 * 1. Requests geolocation permission on mount
 * 2. Watches position changes in real-time
 * 3. Batches updates to backend every 30 seconds
 * 4. Gracefully handles permission denied, high accuracy unavailable, etc.
 * 
 * Returns: { lat, lng, error, isTracking }
 */
const useRiderLocation = () => {
  const [location, setLocation] = useState({ lat: 0, lng: 0 })
  const [error, setError] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  
  const watchIdRef = useRef(null)
  const syncIntervalRef = useRef(null)
  const lastSyncRef = useRef(null)

  // Handle position update from geolocation API
  const handlePositionSuccess = useCallback((position) => {
    const { latitude, longitude } = position.coords
    setLocation({ lat: latitude, lng: longitude })
    setError(null)
  }, [])

  // Handle geolocation errors
  const handlePositionError = useCallback((err) => {
    console.error('Geolocation error:', err)
    setError(err.message)
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Location permission denied. Please enable in settings.')
        break
      case err.POSITION_UNAVAILABLE:
        setError('Location data unavailable')
        break
      case err.TIMEOUT:
        setError('Location request timed out')
        break
      default:
        setError('Failed to get location')
    }
  }, [])

  // Sync location to backend
  const syncLocationToBackend = useCallback(async () => {
    if (location.lat === 0 && location.lng === 0) {
      return // No valid location yet
    }

    try {
      await updateLocation(location.lat, location.lng)
      lastSyncRef.current = new Date()
    } catch (err) {
      console.error('Failed to sync location to backend:', err)
      // Don't set error state here — backend sync failure shouldn't block tracking
    }
  }, [location])

  // On mount: request permission and start watching
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser')
      return
    }

    // Start watching position
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    )

    setIsTracking(true)

    // Set up 30-second sync interval
    syncIntervalRef.current = setInterval(() => {
      syncLocationToBackend()
    }, 30000)

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [handlePositionSuccess, handlePositionError, syncLocationToBackend])

  return {
    lat: location.lat,
    lng: location.lng,
    error,
    isTracking,
  }
}

export default useRiderLocation
