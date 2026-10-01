import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/api';

export const CartDrawer: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  // Group items by shopId so we create orders per shop
  const itemsByShop = items.reduce((acc, item) => {
    const sId = item.product.shopId;
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    if (!shippingAddress.trim()) {
      error('Please provide a valid delivery address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create order for each shop represented in cart
      for (const [shopId, shopItems] of Object.entries(itemsByShop)) {
        await customerService.createOrder({
          shopId,
          shippingAddress: shippingAddress.trim(),
          items: shopItems.map((si) => ({
            productId: si.product.id,
            name: si.product.name,
            quantity: si.quantity,
            price: si.product.price,
          })),
        });
      }

      success('Order placed successfully! Check your orders history.');
      clearCart();
      setIsCartOpen(false);
      navigate('/orders');
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to place order. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900/95 border-l border-white/10 shadow-2xl flex flex-col backdrop-blur-xl animate-drawer-in">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Your Cart ({items.length})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-base font-medium">Your shopping bag is empty</p>
                <p className="text-xs text-slate-500 mt-1">Discover handcrafted goods across our multi-vendor shops.</p>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all"
                >
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-slate-800">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">
                        Total: ${(Number(product.price) * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-slate-950/60 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. 124 Market Street, Suite 400, NY"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-lg font-bold text-white">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  'Processing Order...'
                ) : (
                  <>
                    <span>{isAuthenticated ? 'Place Order' : 'Login to Checkout'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
