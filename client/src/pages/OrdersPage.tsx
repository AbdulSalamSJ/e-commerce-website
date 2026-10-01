import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Truck, AlertCircle, ShoppingBag } from 'lucide-react';
import { customerService, Order } from '../services/api';
import { useToast } from '../context/ToastContext';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await customerService.getMyOrders();
        setOrders(data);
      } catch (err: any) {
        error(err.response?.data?.error || 'Failed to fetch order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Truck className="w-3.5 h-3.5" /> Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="pb-6 border-b border-white/10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Order History</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track packages and review invoices from your multi-store purchases.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 p-8">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No orders yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When you purchase items from merchant stores, your trackable orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      Order #{ord.id.substring(0, 8)}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Placed on {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-slate-400 block uppercase font-mono">Total Paid</span>
                  <span className="text-xl font-black text-emerald-400">
                    ${Number(ord.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order items */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                  Purchased Items:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                    >
                      <span className="text-slate-200 font-medium truncate">
                        {item.name || `Product ${item.productId.substring(0, 6)}`} (x{item.quantity})
                      </span>
                      <span className="text-slate-400 font-mono">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-300">Delivered to: </span>
                  {ord.shippingAddress}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
