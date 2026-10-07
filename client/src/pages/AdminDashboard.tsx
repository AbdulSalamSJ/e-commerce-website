import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers,
  Palette,
  ExternalLink,
  Tag
} from 'lucide-react';
import { adminService, Product, Order, Shop } from '../services/api';
import { useToast } from '../context/ToastContext';
import { getThemeConfig } from '../types/theme';
import { parseCategories } from '../components/Navbar';

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodCategory, setProdCategory] = useState('Electronics');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shop Settings Form
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [shopData, prodsData, ordersData] = await Promise.all([
        adminService.getShopProfile(),
        adminService.getProducts(),
        adminService.getOrders(),
      ]);
      const actualShop = shopData?.shop || shopData || null;
      setShop(actualShop);
      setShopName(actualShop?.name || '');
      setShopDescription(actualShop?.description || '');
      setProducts(Array.isArray(prodsData) ? prodsData : (prodsData?.products || []));
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []));
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to load merchant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a category is clicked in the header, automatically switch to Products tab
  useEffect(() => {
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      setActiveTab('products');
    }
  }, [selectedCategory]);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory.toLowerCase() === 'all') return true;
    if (!p.category) return false;
    const sel = selectedCategory.toLowerCase().trim();
    const prodCat = p.category.toLowerCase().trim();
    const selTokens = sel.split(',').map((c) => c.trim()).filter(Boolean);
    const prodTokens = prodCat.split(',').map((c) => c.trim()).filter(Boolean);
    return (
      prodCat === sel ||
      prodCat.includes(sel) ||
      sel.includes(prodCat) ||
      selTokens.some((t) => prodTokens.includes(t) || prodCat.includes(t)) ||
      prodTokens.some((t) => selTokens.includes(t) || sel.includes(t))
    );
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDescription('');
    setProdPrice('');
    setProdStock('10');
    const initialCat = selectedCategory.toLowerCase() !== 'all'
      ? selectedCategory
      : (shop?.category ? parseCategories(shop.category)[0] : 'Electronics');
    setProdCategory(initialCat);
    setProdImageUrl('');
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description || '');
    setProdPrice(p.price.toString());
    setProdStock(p.stock.toString());
    setProdCategory(p.category || 'General');
    setProdImageUrl(p.imageUrl || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      error('Product name and price are required');
      return;
    }

    setSubmittingProduct(true);
    try {
      const payload = {
        name: prodName,
        description: prodDescription,
        price: parseFloat(prodPrice),
        stock: parseInt(prodStock, 10) || 0,
        category: prodCategory,
        imageUrl: prodImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      };

      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        success(`Updated "${prodName}"`);
      } else {
        await adminService.createProduct(payload);
        success(`Created product "${prodName}"`);
      }

      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error saving product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from store?`)) return;

    try {
      await adminService.deleteProduct(id);
      success(`Removed "${name}"`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Could not delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await adminService.updateOrderStatus(orderId, status);
      success(`Order status updated to ${status}`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminService.updateShopProfile({
        name: shopName,
        description: shopDescription,
      });
      success('Shop profile updated successfully');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update shop');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Merchant Control Center
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {shop?.name || 'Your Store'}
            </h1>
            {shop?.category && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                <Tag className="w-3 h-3 text-emerald-400" />
                {shop.category}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your catalog, fulfill customer orders, and configure store branding.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Products ({selectedCategory.toLowerCase() !== 'all' ? `${filteredProducts.length}/${products.length}` : products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Store Info
          </button>
        </div>
      </div>

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Product Inventory</h2>
              {selectedCategory.toLowerCase() !== 'all' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Category: {selectedCategory}</span>
                  <button
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.delete('category');
                      setSearchParams(p);
                    }}
                    className="ml-1 text-slate-400 hover:text-white cursor-pointer font-bold"
                    title="Clear category filter"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 glass-panel rounded-2xl border border-white/5">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="text-base font-semibold text-white">
                  {selectedCategory.toLowerCase() !== 'all'
                    ? `No products found in "${selectedCategory}"`
                    : 'No products in your catalog'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedCategory.toLowerCase() !== 'all'
                    ? 'There are currently no items under this category in your shop.'
                    : 'Start by publishing items for customers to purchase.'}
                </p>
                {selectedCategory.toLowerCase() !== 'all' && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        const p = new URLSearchParams(searchParams);
                        p.delete('category');
                        setSearchParams(p);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer"
                    >
                      Clear Category Filter
                    </button>
                    <button
                      onClick={openCreateModal}
                      className="px-3 py-1.5 rounded-lg text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                    >
                      + Add Product to {selectedCategory}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col group"
                >
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
                      ${Number(p.price).toFixed(2)}
                    </div>
                    {p.category && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-slate-300 font-medium">
                        {p.category}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base truncate">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {p.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                        <span>Stock: <strong className="text-white">{p.stock}</strong> units</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Store Orders & Fulfillment</h2>

          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            {orders.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No orders placed for this store yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          #{ord.id.substring(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">
                          Customer: <strong className="text-slate-200">{ord.customerEmail || 'Shopper'}</strong>
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <strong>Items:</strong> {ord.items.map((i) => `${i.name || 'Product'} (x${i.quantity})`).join(', ')}
                      </div>

                      <div className="text-xs text-slate-400">
                        <strong>Shipping to:</strong> {ord.shippingAddress}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total</span>
                        <span className="text-base font-extrabold text-white">
                          ${Number(ord.totalAmount).toFixed(2)}
                        </span>
                      </div>

                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : ord.status === 'shipped'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="pending" className="bg-slate-900 text-white">Pending</option>
                        <option value="processing" className="bg-slate-900 text-white">Processing</option>
                        <option value="shipped" className="bg-slate-900 text-white">Shipped</option>
                        <option value="delivered" className="bg-slate-900 text-white">Delivered</option>
                        <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Store Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
          <h2 className="text-xl font-bold text-white">Shop Profile Details</h2>
          <form onSubmit={handleSaveShopSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Assigned Theme Display */}
            {(() => {
              const thConfig = getThemeConfig(shop?.theme);
              return (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      Assigned Shop Theme
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${thConfig.pillBadgeClass}`}>
                      {thConfig.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {thConfig.description}
                  </p>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">Managed by Super-Administrator</span>
                    <a
                      href={`/store/${shop?.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview Storefront
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Assigned Store Category Display */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Assigned Store Category
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  {shop?.category || 'General'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Determines the primary market sector and classification for your shop across the platform marketplace.
              </p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Managed by Super-Administrator</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Add/Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-in">
            <h3 className="text-xl font-bold text-white mb-2">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configure product details, stock count, and showcase photography.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="79.99"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="Electronics, Apparel, Gadgets, etc."
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Upload
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setProdImageUrl(url);
                    }
                  }}
                />
              </div>

              {/* Image Preview */}
              {prodImageUrl && (
                <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                  <img src={prodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="High fidelity audio with 30-hour battery life..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
