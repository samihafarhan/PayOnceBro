// frontend/src/context/CartContext.jsx
import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { checkCluster, getDeliveryFee } from '../services/deliveryService'

const INITIAL_CLUSTER = {
  checked: false, eligible: false, reason: null,
  centroid: null, maxDistanceKm: null, deliveryFee: null, eta: null,
}
const INITIAL_STATE = {
  items: [], clusterStatus: INITIAL_CLUSTER, userLocation: null, checkingCluster: false,
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.menuItemId === action.payload.menuItemId)
      if (existing) {
        return { ...state, items: state.items.map((i) => i.menuItemId === action.payload.menuItemId ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.menuItemId !== action.payload) }
    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload
      if (quantity <= 0) return { ...state, items: state.items.filter((i) => i.menuItemId !== menuItemId) }
      return { ...state, items: state.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)) }
    }
    case 'CLEAR_CART':
      return { ...INITIAL_STATE, userLocation: state.userLocation }
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload }
    case 'SET_CHECKING_CLUSTER':
      return { ...state, checkingCluster: action.payload }
    case 'SET_CLUSTER_STATUS':
      return { ...state, clusterStatus: action.payload, checkingCluster: false }
    case 'RESET_CLUSTER':
      return { ...state, clusterStatus: INITIAL_CLUSTER, checkingCluster: false }
    default:
      return state
  }
}

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE)
  const debounceTimer = useRef(null)

  const subtotal      = state.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const restaurantIds = [...new Set(state.items.map((i) => i.restaurantId))]
  const deliveryFee   = state.clusterStatus.deliveryFee?.fee ?? 0
  const total         = subtotal + deliveryFee
  const itemCount     = state.items.reduce((s, i) => s + i.quantity, 0)
  const itemsByRestaurant = state.items.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = { restaurantId: item.restaurantId, restaurantName: item.restaurantName, items: [] }
    }
    acc[item.restaurantId].items.push(item)
    return acc
  }, {})

  const runClusterCheck = useCallback(async (items, location) => {
    const ids = [...new Set(items.map((i) => i.restaurantId))]
    if (ids.length === 0) {
      dispatch({ type: 'RESET_CLUSTER' })
      return
    }

    const lat = location?.lat
    const lng = location?.lng
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng)

    dispatch({ type: 'SET_CHECKING_CLUSTER', payload: true })
    try {
      let clusterData = {
        checked: false,
        eligible: false,
        reason: null,
        centroid: null,
        maxDistanceKm: null,
        eta: null,
      }

      if (ids.length >= 2) {
        const data = await checkCluster({
          restaurantIds: ids,
          userLat: hasLocation ? lat : null,
          userLng: hasLocation ? lng : null,
        })

        clusterData = {
          checked: true,
          eligible: Boolean(data.eligible),
          reason: data.reason ?? null,
          centroid: data.centroid ?? null,
          maxDistanceKm: data.maxDistanceKm ?? null,
          eta: data.eta ?? null,
        }
      }

      const feeData = hasLocation
        ? await getDeliveryFee({
            restaurantIds: ids,
            userLat: lat,
            userLng: lng,
            isCluster: ids.length >= 2 ? clusterData.eligible : false,
          })
        : null

      dispatch({
        type: 'SET_CLUSTER_STATUS',
        payload: {
          checked: clusterData.checked,
          eligible: clusterData.eligible,
          reason: clusterData.reason,
          centroid: clusterData.centroid,
          maxDistanceKm: clusterData.maxDistanceKm,
          deliveryFee: feeData,
          eta: clusterData.eta,
        },
      })
    } catch {
      dispatch({ type: 'RESET_CLUSTER' })
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => runClusterCheck(state.items, state.userLocation), 600)
    return () => clearTimeout(debounceTimer.current)
  }, [state.items, state.userLocation, runClusterCheck])

  const addItem = (menuItem, restaurant) =>
    dispatch({ type: 'ADD_ITEM', payload: { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, restaurantId: restaurant.id, restaurantName: restaurant.name } })
  const removeItem     = (menuItemId) => dispatch({ type: 'REMOVE_ITEM', payload: menuItemId })
  const updateQuantity = (menuItemId, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId, quantity } })
  const clearCart      = () => dispatch({ type: 'CLEAR_CART' })
  const setUserLocation = (lat, lng) => dispatch({ type: 'SET_USER_LOCATION', payload: { lat, lng } })

  return (
    <CartContext.Provider value={{
      items: state.items, clusterStatus: state.clusterStatus,
      userLocation: state.userLocation, checkingCluster: state.checkingCluster,
      subtotal, deliveryFee, total, restaurantIds, itemsByRestaurant, itemCount,
      addItem, removeItem, updateQuantity, clearCart, setUserLocation,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}