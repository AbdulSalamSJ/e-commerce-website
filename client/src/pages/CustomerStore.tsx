import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Store, 
  ShoppingBag, 
  Sparkles, 
  Tag
} from 'lucide-react';
import { customerService, Product, Shop } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const CustomerStore: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { addToCart } = useCart();
  const { success } = useToast();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [shopsData, prodsData] = await Promise.all([
          customerService.getShops(),
          customerService.getProducts(),
        ]);
        setShops(shopsData);
        setProducts(prodsData);
      } catch (err) {
        console.error('Failed to load storefront catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]];

  const filteredProducts = products.filter((p) => {
    const matchesShop = selectedShopId === 'all' || p.shopId === selectedShopId;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesShop && matchesCategory && matchesSearch;
  });

  const getShopName = (shopId: string) => {
    const s = shops.find((item) => item.id === shopId);
    return s ? s.name : 'Verified Merchant';
  };

  const handleAddToCart = (p: Product) => {
    addToCart(p, 1);
    success(`Added "${p.name}" to cart`);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Multi-Vendor Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Curated Independent Brands.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              One Unified Checkout.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Shop directly from verified boutique merchants and emerging creators with custom order routing.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-emerald-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, technology, apparel..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-panel text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xl transition-all"
            />
          </div>
        </div>

        {/* Ambient radial blur glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl -z-10 rounded-full pointer-events-none"></div>
      </section>

      {/* Storefront Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter Bar: Shops & Categories */}
        <div className="space-y-4">
          {/* Shop selector chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider shrink-0 mr-2 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              Stores:
            </span>
            <button
              onClick={() => setSelectedShopId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedShopId === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Stores
            </button>
            {shops.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShopId(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedShopId === s.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Category selector chips */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider shrink-0 mr-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                Category:
              </span>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-2xl border border-white/5 p-8">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your filter or search terms to find available merchant merchandise.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col group hover:border-emerald-500/40"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-slate-900 overflow-hidden">
                  <img
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-medium text-emerald-300 border border-white/10">
                    {getShopName(p.shopId)}
                  </div>
                  {p.category && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[10px] text-slate-300">
                      {p.category}
                    </div>
                  )}
                </div>

                {/* Info & Add to Cart */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base truncate group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'Premium curated collection item.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Price</span>
                      <span className="text-lg font-black text-white">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={p.stock <= 0}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{p.stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
