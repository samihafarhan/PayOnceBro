// frontend/src/hooks/useUserOrders.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Live Order Tracking
//
// Fetches the authenticated user's orders AND subscribes to Supabase real-time
// updates so the Orders page stays live without polling.
//
// Pattern mirrors the existing `useRestaurantOrders.js` hook (Member 3's).
// We do NOT touch that hook; we created a parallel one scoped to the user.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import supabase from '../lib/supabase'
import { getMyOrders } from '../services/orderService'

const useUserOrders = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const orders = await getMyOrders()
      setData(Array.isArray(orders) ? orders : [])
    } catch (err) {
      setError(err)
      console.error('useUserOrders refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Realtime subscription — any INSERT/UPDATE on the `orders` table triggers
  // a refresh. The server-side getMyOrders already filters by user_id, so we
  // don't need row-level filtering here.
  useEffect(() => {
    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { data, loading, error, refresh }
}

export default useUserOrders
