// frontend/src/components/user/CartItem.jsx
import { useCart } from '../../context/CartContext'

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart()
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">৳{item.price.toFixed(0)} each</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
          className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors flex items-center justify-center"
        >−</button>
        <span className="w-5 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
          className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors flex items-center justify-center"
        >+</button>
      </div>
      <p className="text-sm font-bold text-gray-800 w-14 text-right shrink-0">
        ৳{(item.price * item.quantity).toFixed(0)}
      </p>
      <button
        onClick={() => removeItem(item.menuItemId)}
        className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none shrink-0"
      >×</button>
    </div>
  )
}

export default CartItem