import { useEffect } from 'react'
import supabase from '../lib/supabase'
import useFetch from './useFetch'
import { getRestaurantOrders } from '../services/restaurantService'

/**
 * Fetches restaurant orders and subscribes to real-time changes on the
 * `orders` table. Any INSERT or UPDATE triggers a full refresh so the
 * dashboard stays live without polling.
 *
 * Returns the same shape as useFetch: { data, loading, error, fn: refresh }
 */
const useRestaurantOrders = () => {
  const { data, loading, error, fn: fetchOrders } = useFetch(getRestaurantOrders)

  // Initial load
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Real-time subscription — fires on any order INSERT or UPDATE
  useEffect(() => {
    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-fetch on any change; the controller filters to this restaurant's
          // orders server-side, so no client-side filtering is needed here.
          fetchOrders()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  return { data, loading, error, refresh: fetchOrders }
}

export default useRestaurantOrders
