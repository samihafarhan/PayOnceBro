import supabase from '../config/db.js'

const ANALYTICS_LOOKBACK_DAYS = Number(process.env.ANALYTICS_LOOKBACK_DAYS) || 90
const ANALYTICS_MAX_ROWS = Number(process.env.ANALYTICS_MAX_ROWS) || 5000

const toDayKey = (isoDate) => new Date(isoDate).toISOString().slice(0, 10)

const getLast7DayBuckets = (nowInput = new Date()) => {
  const buckets = []
  const now = new Date(nowInput)

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const key = day.toISOString().slice(0, 10)
    buckets.push({ day: key, revenue: 0 })
  }

  return buckets
}

export const calculateAverageDeliveryMinutes = (orders = []) => {
  const durations = (orders ?? [])
    .map((order) => {
      const start = new Date(order.created_at).getTime()
      const end = new Date(order.delivered_at).getTime()
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
      return (end - start) / 60000
    })
    .filter((value) => value != null)

  if (!durations.length) return 0
  return Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2))
}

export const buildWeeklyRevenue = (orders = [], nowInput = new Date()) => {
  const buckets = getLast7DayBuckets(nowInput)
  const bucketMap = new Map(buckets.map((b) => [b.day, b]))

  ;(orders ?? []).forEach((row) => {
    const key = toDayKey(row.created_at)
    const bucket = bucketMap.get(key)
    if (!bucket) return
    bucket.revenue = Number((bucket.revenue + Number(row.total_price || 0)).toFixed(2))
  })

  return buckets
}

export const calculateRiderEfficiency = (deliveredOrders = 0, riderCount = 0) => {
  const deliveries = Number(deliveredOrders || 0)
  const riders = Number(riderCount || 0)
  if (riders <= 0) return 0
  return Number((deliveries / riders).toFixed(2))
}

export const getAnalytics = async () => {
  const lookbackStart = new Date()
  lookbackStart.setDate(lookbackStart.getDate() - ANALYTICS_LOOKBACK_DAYS)
  lookbackStart.setHours(0, 0, 0, 0)

  const [
    { count: totalOrders, error: totalErr },
    { count: clusteredOrders, error: clusteredErr },
    { count: totalClusters, error: clustersErr },
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).not('cluster_id', 'is', null),
    supabase.from('clusters').select('id', { count: 'exact', head: true }),
  ])

  if (totalErr) throw totalErr
  if (clusteredErr) throw clusteredErr
  if (clustersErr) throw clustersErr

  const { data: deliveredOrders, error: deliveredErr } = await supabase
    .from('orders')
    .select('created_at, delivered_at')
    .eq('status', 'delivered')
    .not('delivered_at', 'is', null)
    .gte('created_at', lookbackStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(ANALYTICS_MAX_ROWS)

  if (deliveredErr) throw deliveredErr

  const avgDeliveryTime = calculateAverageDeliveryMinutes(deliveredOrders)

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: todayOrders, error: todayErr } = await supabase
    .from('orders')
    .select('total_price, status')
    .gte('created_at', startOfDay.toISOString())
    .eq('status', 'delivered')

  if (todayErr) throw todayErr

  const dailySales = Number(
    ((todayOrders ?? []).reduce((sum, row) => sum + Number(row.total_price || 0), 0)).toFixed(2)
  )

  const { data: orderItems, error: orderItemsErr } = await supabase
    .from('order_items')
    .select('menu_item_id, menu_items(name), orders!inner(status, created_at)')
    .eq('orders.status', 'delivered')
    .gte('orders.created_at', lookbackStart.toISOString())
    .limit(ANALYTICS_MAX_ROWS)

  if (orderItemsErr) throw orderItemsErr

  const itemCounter = new Map()
  ;(orderItems ?? []).forEach((row) => {
    const id = row.menu_item_id
    if (!id) return

    const existing = itemCounter.get(id) || {
      id,
      name: row.menu_items?.name || 'Unknown item',
      count: 0,
    }
    existing.count += 1
    itemCounter.set(id, existing)
  })

  const mostOrderedItem = [...itemCounter.values()].sort((a, b) => b.count - a.count)[0] || null

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: weeklyOrders, error: weeklyErr } = await supabase
    .from('orders')
    .select('created_at, total_price')
    .gte('created_at', sevenDaysAgo.toISOString())
    .eq('status', 'delivered')

  if (weeklyErr) throw weeklyErr

  const [{ count: ridersCount, error: ridersErr }, { count: deliveredWithRiderCount, error: deliveredWithRiderErr }] =
    await Promise.all([
      supabase.from('riders').select('id', { count: 'exact', head: true }),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .not('rider_id', 'is', null)
        .not('delivered_at', 'is', null)
        .gte('delivered_at', sevenDaysAgo.toISOString()),
    ])

  if (ridersErr) throw ridersErr
  if (deliveredWithRiderErr) throw deliveredWithRiderErr

  const { data: lowRatedRows, error: lowRatedErr } = await supabase
    .from('riders')
    .select('id, user_id, avg_rating, total_deliveries, is_available')
    .lt('avg_rating', 3)
    .order('avg_rating', { ascending: true })
    .limit(10)

  if (lowRatedErr) throw lowRatedErr

  const lowRatedUserIds = [...new Set((lowRatedRows ?? []).map((row) => row.user_id).filter(Boolean))]
  let profileMap = {}

  if (lowRatedUserIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', lowRatedUserIds)

    if (profileErr) throw profileErr

    profileMap = (profiles ?? []).reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})
  }

  const lowRatedRiders = (lowRatedRows ?? []).map((row) => {
    const profile = profileMap[row.user_id] || {}
    const fallbackName = row.user_id ? `Rider ${String(row.user_id).slice(0, 8)}` : 'Unknown rider'
    return {
      id: row.id,
      userId: row.user_id,
      name: profile.full_name || profile.username || fallbackName,
      avgRating: Number(row.avg_rating || 0),
      totalDeliveries: Number(row.total_deliveries || 0),
      isAvailable: Boolean(row.is_available),
    }
  })

  const buckets = buildWeeklyRevenue(weeklyOrders)

  const total = Number(totalOrders || 0)
  const clustered = Number(clusteredOrders || 0)
  const clusterRate = total > 0 ? Number(((clustered / total) * 100).toFixed(2)) : 0
  const riderCount = Number(ridersCount || 0)
  const deliveredOrdersPerRiderWindow = Number(deliveredWithRiderCount || 0)
  const riderEfficiency = calculateRiderEfficiency(deliveredOrdersPerRiderWindow, riderCount)

  return {
    totalOrders: total,
    clusteredOrders: clustered,
    totalClusters: Number(totalClusters || 0),
    clusterRate,
    avgDeliveryTime,
    riderEfficiency,
    riderEfficiencyWindowDays: 7,
    riderCount,
    deliveredOrdersPerRiderWindow,
    dailySales,
    mostOrderedItem,
    weeklyRevenue: buckets,
    lowRatedRiders,
  }
}