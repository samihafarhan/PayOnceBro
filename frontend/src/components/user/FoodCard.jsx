/**
 * FoodCard.jsx
 *
 * Think of this like a recipe card at a restaurant menu!
 * It shows ONE food item: its name, price, restaurant, and tags.
 *
 * Props:
 *   item           - { menuItem, restaurant, distanceKm, isClusterEligible }
 *   onAddToCart    - function called when user clicks "Add to Cart"
 */
const FoodCard = ({ item, onAddToCart }) => {
  const { menuItem, restaurant, distanceKm, isClusterEligible } = item

  const formatPrice = (price) => `৳${Number(price).toFixed(0)}`
  const formatDistance = (km) =>
    km === null ? null : km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Colourful top accent — colour changes by category */}
      <div
        className="h-1.5 w-full"
        style={{ background: categoryGradient(menuItem.category) }}
      />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Food name + cluster badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition-colors">
            {menuItem.name}
          </h3>
          {isClusterEligible && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              🔗 Save more!
            </span>
          )}
        </div>

        {/* Description */}
        {menuItem.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {menuItem.description}
          </p>
        )}

        {/* AI Tags (dietary info like vegan, spicy, etc.) */}
        {menuItem.aiTags && menuItem.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {menuItem.aiTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
              >
                {TAG_EMOJI[tag] ?? '🏷️'} {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* Restaurant info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="text-sm">🍽️</span>
          <span className="truncate">{restaurant.name}</span>
          {restaurant.avgRating > 0 && (
            <span className="ml-auto flex items-center gap-0.5 text-amber-500 font-medium shrink-0">
              ⭐ {Number(restaurant.avgRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Distance */}
        {distanceKm !== null && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>📍</span>
            <span>{formatDistance(distanceKm)} away</span>
            {restaurant.avgPrepTime && (
              <>
                <span className="mx-1 text-gray-300">·</span>
                <span>⏱ ~{restaurant.avgPrepTime} min prep</span>
              </>
            )}
          </p>
        )}

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-lg font-black text-gray-900">
            {formatPrice(menuItem.price)}
          </span>
          <button
            onClick={() => onAddToCart && onAddToCart(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all duration-150 shadow-sm shadow-orange-200"
          >
            <span>+</span> Add
          </button>
        </div>
      </div>
    </div>
  )
}

// Gives each food category a unique colourful gradient for the top bar
const categoryGradient = (category = '') => {
  const c = category.toLowerCase()
  if (c.includes('burger') || c.includes('fast')) return 'linear-gradient(90deg, #f97316, #fb923c)'
  if (c.includes('pizza')) return 'linear-gradient(90deg, #ef4444, #f87171)'
  if (c.includes('chinese') || c.includes('asian')) return 'linear-gradient(90deg, #eab308, #fbbf24)'
  if (c.includes('italian') || c.includes('pasta')) return 'linear-gradient(90deg, #22c55e, #4ade80)'
  if (c.includes('indian') || c.includes('curry')) return 'linear-gradient(90deg, #f59e0b, #fbbf24)'
  if (c.includes('veg') || c.includes('salad')) return 'linear-gradient(90deg, #16a34a, #22c55e)'
  if (c.includes('dessert') || c.includes('sweet')) return 'linear-gradient(90deg, #ec4899, #f472b6)'
  return 'linear-gradient(90deg, #6366f1, #818cf8)'
}

// Fun emoji for each AI tag
const TAG_EMOJI = {
  vegan: '🌱',
  vegetarian: '🥗',
  halal: '☪️',
  spicy: '🌶️',
  mild: '😊',
  sweet: '🍬',
  'gluten-free': '🌾',
  'dairy-free': '🥛',
  'high-protein': '💪',
  'low-calorie': '⚖️',
}

export default FoodCard