// frontend/src/components/user/CartItem.jsx
import { useCart } from '../../context/CartContext'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart()
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground">৳{item.price.toFixed(0)} each</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
            className="h-7 w-7 rounded-full"
          >
            −
          </Button>
          <span className="w-5 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            className="h-7 w-7 rounded-full"
          >
            +
          </Button>
        </div>
        <p className="text-sm font-bold text-foreground w-14 text-right shrink-0">
          ৳{(item.price * item.quantity).toFixed(0)}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => removeItem(item.menuItemId)}
          className="text-muted-foreground hover:text-destructive"
        >
          ×
        </Button>
      </div>
      <Separator className="mt-2" />
    </div>
  )
}

export default CartItem