import * as orderModel from '../models/orderModel.js'
import * as riderModel from '../models/riderModel.js'

const SIMULATE_ORDER_FLOW = String(process.env.SIMULATE_ORDER_FLOW || '').toLowerCase() === 'true'
const SIMULATED_STEP_MS = Number(process.env.SIMULATED_ORDER_STEP_MS) || 5000
const simulatedTimers = new Map()

const clearSimulationTimers = (orderId) => {
  const timers = simulatedTimers.get(orderId)
  if (Array.isArray(timers)) {
    timers.forEach((t) => clearTimeout(t))
  }
  simulatedTimers.delete(orderId)
}

const recordTimer = (orderId, timerId) => {
  const existing = simulatedTimers.get(orderId) || []
  existing.push(timerId)
  simulatedTimers.set(orderId, existing)
}

const getRiderUserIdForOrder = async (order) => {
  if (!order?.rider_id) return null
  const rider = await riderModel.getById(order.rider_id)
  return rider?.user_id ?? null
}

const applyStatusUpdate = async (orderId, status, changedByUserId) => {
  const updated = await orderModel.updateStatus(orderId, status)
  if (changedByUserId) {
    try {
      await orderModel.insertStatusHistory(orderId, status, changedByUserId)
    } catch (historyErr) {
      console.warn('Order status history insert failed on simulated update:', historyErr?.message || historyErr)
    }
  }
  return updated
}

const simulateNextStep = (orderId, fromStatus, toStatus, getChangedByUserId, delayMs) => {
  const timerId = setTimeout(async () => {
    try {
      const current = await orderModel.getById(orderId)
      if (!current || current.status !== fromStatus) return

      const changedByUserId = await getChangedByUserId(current)
      await applyStatusUpdate(orderId, toStatus, changedByUserId)

      if (toStatus === 'delivered') {
        if (current.rider_id) {
          const rider = await riderModel.getById(current.rider_id)
          if (rider) {
            await riderModel.setAvailable(rider.id, true)
            await riderModel.updateStats(rider.id, (rider.total_deliveries || 0) + 1)
          }
        }
        clearSimulationTimers(orderId)
        return
      }

      if (toStatus === 'preparing') {
        simulateNextStep(orderId, 'preparing', 'pickup', getRiderUserIdForOrder, SIMULATED_STEP_MS)
      } else if (toStatus === 'pickup') {
        simulateNextStep(orderId, 'pickup', 'on_the_way', getRiderUserIdForOrder, SIMULATED_STEP_MS)
      } else if (toStatus === 'on_the_way') {
        simulateNextStep(orderId, 'on_the_way', 'delivered', getRiderUserIdForOrder, SIMULATED_STEP_MS)
      }
    } catch (err) {
      console.warn('Simulated order step failed:', err?.message || err)
    }
  }, delayMs)

  recordTimer(orderId, timerId)
}

export const startSimulatedOrderFlow = (orderId, restaurantUserId) => {
  if (!SIMULATE_ORDER_FLOW) return
  clearSimulationTimers(orderId)
  simulateNextStep(orderId, 'accepted', 'preparing', async () => restaurantUserId, SIMULATED_STEP_MS)
}
