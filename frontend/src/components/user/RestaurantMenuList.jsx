// frontend/src/components/user/RestaurantMenuList.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders a restaurant's menu grouped by category, with an "Add to cart"
// button on each item. Integrates with CartContext (Member 1).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useCart } from '../../context/CartContext'
import { toast } from 'sonner'

const MenuItemRow = ({ item, restaurant, qtyInCart, onAdd, onChangeQty, onRemove }) => (
  <div className="flex items-start gap-3 py-3">
    {item.image_url && (
      <img
        src={item.image_url}
        alt={item.name}
        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )}

    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-900">{item.name}</p>
      {item.description && (
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
      )}

      {Array.isArray(item.ai_tags) && item.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.ai_tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-bold text-orange-600 mt-1.5">৳{Number(item.price).toFixed(0)}</p>
    </div>

    <div className="shrink-0">
      {qtyInCart === 0 ? (
        <button
          onClick={() => onAdd(item, restaurant)}
          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 active:scale-95 transition"
        >
          + Add
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChangeQty(item.id, qtyInCart - 1)}
            className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold"
          >
            −
          </button>
          <span className="text-sm font-semibold w-5 text-center">{qtyInCart}</span>
          <button
            onClick={() => onChangeQty(item.id, qtyInCart + 1)}
            className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold"
          >
            +
          </button>
        </div>
      )}
    </div>
  </div>
)

const RestaurantMenuList = ({ menu = [], restaurant }) => {
  const { items, addItem, updateQuantity } = useCart()

  // Group menu items by category
  const grouped = useMemo(() => {
    const g = {}
    menu.forEach((m) => {
      const cat = m.category || 'Other'
      if (!g[cat]) g[cat] = []
      g[cat].push(m)
    })
    return g
  }, [menu])

  // For each menu item, look up current quantity in cart (0 if not present)
  const quantityOf = (menuItemId) =>
    items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0

  const handleAdd = (item, r) => {
    addItem(
      { id: item.id, name: item.name, price: Number(item.price) },
      { id: r.id, name: r.name }
    )
    toast.success(`${item.name} added to cart`)
  }

  const handleChangeQty = (menuItemId, qty) => {
    updateQuantity(menuItemId, qty)
  }

  if (!menu.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <span className="text-3xl">🍽️</span>
        <p className="text-sm text-gray-500 mt-2">No menu items available right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            {cat}
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 px-4">
            {catItems.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                restaurant={restaurant}
                qtyInCart={quantityOf(item.id)}
                onAdd={handleAdd}
                onChangeQty={handleChangeQty}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RestaurantMenuList
