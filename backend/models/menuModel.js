import supabase from '../config/db.js'

/**
 * searchItems — finds food items matching a search query + filters.
 *
 * Think of this like a librarian who goes into the database (our giant
 * filing cabinet of food info) and finds everything that matches what
 * you're looking for.
 *
 * @param {string} query      - what the user typed, e.g. "burger"
 * @param {object} filters    - { minPrice, maxPrice, cuisine }
 * @returns array of { menuItem, restaurant } objects
 */
export const searchItems = async (query = '', filters = {}) => {
  const { minPrice, maxPrice, cuisine } = filters

  // Start building the database query
  // We join menu_items WITH restaurants so we get location info too
  let dbQuery = supabase
    .from('menu_items')
    .select(`
      id,
      name,
      description,
      price,
      category,
      is_available,
      ai_tags,
      restaurant_id,
      restaurants (
        id,
        name,
        address,
        lat,
        lng,
        avg_rating,
        is_active,
        avg_prep_time
      )
    `)
    .eq('is_available', true) // only show items that are available

  // Filter: only show items from active (open) restaurants
  // The .not filter removes rows where restaurant is not active
  // (Supabase doesn't support nested eq directly, so we filter after)

  // Search by name or description if user typed something
  if (query && query.trim().length > 0) {
    const q = query.trim().toLowerCase()
    // ilike means "case-insensitive like" — finds "Burger" even if you type "burger"
    dbQuery = dbQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Filter by minimum price
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    dbQuery = dbQuery.gte('price', Number(minPrice))
  }

  // Filter by maximum price
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    dbQuery = dbQuery.lte('price', Number(maxPrice))
  }

  // Filter by cuisine/category (e.g. "pizza", "burger", "chinese")
  if (cuisine && cuisine.trim().length > 0) {
    dbQuery = dbQuery.ilike('category', `%${cuisine.trim()}%`)
  }

  // Order by price ascending so cheapest shows first
  dbQuery = dbQuery.order('price', { ascending: true }).limit(50)

  const { data, error } = await dbQuery

  if (error) throw error

  // Filter out items from inactive restaurants (we do this in JS since
  // Supabase doesn't easily filter on joined table columns)
  const filtered = (data ?? []).filter(
    (item) => item.restaurants && item.restaurants.is_active === true
  )

  return filtered
}

/**
 * getCategories — returns all unique food categories in the database.
 * Used to populate the cuisine filter dropdown.
 */
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('category')
    .eq('is_available', true)

  if (error) throw error

  // Get unique categories, remove nulls/empties
  const categories = [
    ...new Set(
      (data ?? [])
        .map((item) => item.category)
        .filter(Boolean)
        .map((c) => c.trim())
    ),
  ].sort()

  return categories
}