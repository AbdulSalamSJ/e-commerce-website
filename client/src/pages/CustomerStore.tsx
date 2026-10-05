import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Tag,
  Palette
} from 'lucide-react';
import { customerService, Product, Shop } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getThemeConfig, ShopThemeId } from '../types/theme';

export const CustomerStore: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const selectedCategory = searchParams.get('category') || 'all';
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
        const loadedShops: Shop[] = Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []);
        setShops(loadedShops);
        setProducts(Array.isArray(prodsData) ? prodsData : (prodsData?.products || []));

        // If navigated by /store/:slug, preselect that shop
        if (slug) {
          const matched = loadedShops.find((s) => s.slug === slug);
          if (matched) {
            setSelectedShopId(matched.id);
          }
        }
      } catch (err) {
        console.error('Failed to load storefront catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [slug]);

  const activeShop = selectedShopId !== 'all' ? shops.find((item) => item.id === selectedShopId) : null;
  const activeThemeId: ShopThemeId = (activeShop?.theme || 'cyber-neon') as ShopThemeId;
  const themeConfig = getThemeConfig(activeThemeId);

  const filteredProducts = products.filter((p) => {
    const matchesShop = selectedShopId === 'all' || p.shopId === selectedShopId;
    const prodShop = shops.find((s) => s.id === p.shopId);
    const matchesCategory =
      selectedCategory.toLowerCase() === 'all' ||
      (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) ||
      (prodShop?.category && prodShop.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesShop && matchesCategory && matchesSearch;
  });

  const getShopById = (shopId: string) => {
    return shops.find((item) => item.id === shopId);
  };

  const handleAddToCart = (p: Product) => {
    addToCart(p, 1);
    success(`Added "${p.name}" to cart`);
  };

  const heroGradients: Record<ShopThemeId, string> = {
    'cyber-neon': 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent',
    'luxury-gold': 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent',
    'sunset-flare': 'bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent',
  };

  const ambientGlows: Record<ShopThemeId, string> = {
    'cyber-neon': 'bg-gradient-to-tr from-emerald-600/20 via-cyan-500/15 to-transparent',
    'luxury-gold': 'bg-gradient-to-tr from-amber-600/25 via-yellow-500/15 to-transparent',
    'sunset-flare': 'bg-gradient-to-tr from-rose-600/25 via-violet-600/15 to-transparent',
  };

  return (
    <div className="space-y-12 pb-16 transition-colors duration-300" data-theme={activeThemeId}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {activeShop ? (
            <>
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                <div 
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm border"
                  style={{
                    backgroundColor: `${themeConfig.primaryColor}15`,
                    borderColor: `${themeConfig.primaryColor}40`,
                    color: themeConfig.primaryColor,
                  }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{themeConfig.badgeText} Theme • {activeShop.name}</span>
                </div>

                {activeShop.category && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Tag className="w-3 h-3" />
                    <span>{activeShop.category}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                {activeShop.name}{' '}
                <span className={heroGradients[activeThemeId]}>
                  Storefront
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {activeShop.description || themeConfig.description}
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Multi-Vendor Marketplace • 3 Branded Themes</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                Curated Independent Brands.{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  Custom Shop Themes.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Explore shops personalized by their SuperAdmin assigned themes: Cyber Neon, Royal Luxe, and Solar Sunset.
              </p>
            </>
          )}

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, technology, apparel..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-panel text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xl transition-all"
            />
          </div>
        </div>

        {/* Ambient radial blur glow */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] blur-3xl -z-10 rounded-full pointer-events-none transition-all duration-700 ${ambientGlows[activeThemeId]}`}
        />
      </section>

      {/* Storefront Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Catalog Section Header & Active Category Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeShop ? `${activeShop.name} Catalog` : 'Catalog Products'}</span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
              </span>
            </h2>
            {selectedCategory.toLowerCase() !== 'all' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <Tag className="w-3.5 h-3.5" />
                <span className="capitalize">{selectedCategory}</span>
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
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
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
            {filteredProducts.map((p) => {
              const pShop = getShopById(p.shopId);
              const pTheme = getThemeConfig(pShop?.theme);
              return (
                <div
                  key={p.id}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col group transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="relative h-56 bg-slate-900 overflow-hidden">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div 
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-md backdrop-blur-md text-[11px] font-semibold border flex items-center gap-1.5 shadow-sm"
                      style={{
                        backgroundColor: 'rgba(8, 12, 20, 0.85)',
                        borderColor: `${pTheme.primaryColor}50`,
                        color: pTheme.primaryColor,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pTheme.primaryColor }} />
                      <span>{pShop ? pShop.name : 'Merchant'}</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] text-slate-300 border border-white/10 bg-slate-950/70 font-mono">
                      {pTheme.badgeText}
                    </div>
                  </div>

                  {/* Info & Add to Cart */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base truncate transition-colors">
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${pTheme.buttonClass}`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{p.stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

