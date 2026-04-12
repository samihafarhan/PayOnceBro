import supabase from '../config/db.js'

export const getDeliveredOrderForUser = async (orderId, userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .eq('user_id', userId)
    .eq('status', 'delivered')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const orderIncludesRestaurant = async (orderId, restaurantId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('restaurant_id', restaurantId)
    .limit(1)

  if (error) throw error
  return (data ?? []).length > 0
}

export const findExistingRestaurantRating = async (orderId, userId, restaurantId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('order_id', orderId)
    .eq('rated_by', userId)
    .eq('restaurant_id', restaurantId)
    .limit(1)

  if (error) throw error
  return (data ?? [])[0] ?? null
}

export const createRestaurantRating = async ({ orderId, userId, restaurantId, score, reviewText }) => {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      order_id: orderId,
      rated_by: userId,
      restaurant_id: restaurantId,
      score,
      review_text: reviewText ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const listRestaurantReviews = async (restaurantId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('id, order_id, score, review_text, created_at, restaurant_response, response_at, rated_by')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const userIds = [...new Set(rows.map((r) => r.rated_by).filter(Boolean))]

  let profilesById = {}
  if (userIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', userIds)

    if (profileErr) throw profileErr

    profilesById = (profiles ?? []).reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})
  }

  return rows.map((row) => ({
    ...row,
    reviewer_name:
      profilesById[row.rated_by]?.full_name ||
      profilesById[row.rated_by]?.username ||
      'Customer',
  }))
}

export const addRestaurantResponse = async ({ ratingId, restaurantId, responseText }) => {
  const { data, error } = await supabase
    .from('ratings')
    .update({
      restaurant_response: responseText,
      response_at: new Date().toISOString(),
    })
    .eq('id', ratingId)
    .eq('restaurant_id', restaurantId)
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const calculateRestaurantAverage = async (restaurantId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('score')
    .eq('restaurant_id', restaurantId)

  if (error) throw error

  const scores = (data ?? []).map((r) => Number(r.score)).filter((n) => !Number.isNaN(n))
  if (scores.length === 0) return 0

  const total = scores.reduce((sum, n) => sum + n, 0)
  return Number((total / scores.length).toFixed(2))
}

export const updateRestaurantAverage = async (restaurantId, avgRating) => {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ avg_rating: avgRating })
    .eq('id', restaurantId)
    .select('id, avg_rating')
    .single()

  if (error) throw error
  return data
}
