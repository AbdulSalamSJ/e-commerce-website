import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Store, 
  Package, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sparkles,
  Layers,
  Headphones,
  Gamepad2,
  Monitor,
  Watch,
  Gem,
  Shirt,
  Tag,
  Cpu,
  Coffee,
  Activity,
  Heart,
  BookOpen,
  Home,
  Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { customerService, Shop } from '../services/api';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getCategoryIcon = (name: string): React.ComponentType<{ className?: string }> => {
  const lower = name.toLowerCase();
  if (lower === 'all' || lower.includes('all product')) return Sparkles;
  if (lower.includes('snack') || lower.includes('food') || lower.includes('gourmet') || lower.includes('fruit') || lower.includes('grocery') || lower.includes('drink')) return Coffee;
  if (lower.includes('audio') || lower.includes('sound') || lower.includes('headphone') || lower.includes('head set') || lower.includes('headset')) return Headphones;
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('vr')) return Gamepad2;
  if (lower.includes('display') || lower.includes('screen') || lower.includes('monitor') || lower.includes('tv')) return Monitor;
  if (lower.includes('watch') || lower.includes('clock') || lower.includes('time')) return Watch;
  if (lower.includes('jewel') || lower.includes('gem') || lower.includes('luxury') || lower.includes('gold') || lower.includes('diamond')) return Gem;
  if (lower.includes('apparel') || lower.includes('fashion') || lower.includes('cloth') || lower.includes('shirt') || lower.includes('streetwear')) return Shirt;
  if (lower.includes('tech') || lower.includes('electron') || lower.includes('gadget') || lower.includes('cpu') || lower.includes('hardware') || lower.includes('mobile') || lower.includes('phone')) return Cpu;
  if (lower.includes('sport') || lower.includes('outdoor') || lower.includes('fitness')) return Activity;
  if (lower.includes('beauty') || lower.includes('health') || lower.includes('cosmetic') || lower.includes('wellness') || lower.includes('parfum') || lower.includes('fragrance') || lower.includes('perfume')) return Heart;
  if (lower.includes('book') || lower.includes('media') || lower.includes('library')) return BookOpen;
  if (lower.includes('home') || lower.includes('living') || lower.includes('decor') || lower.includes('furniture')) return Home;
  if (lower.includes('art') || lower.includes('collectible')) return Palette;
  return Tag;
};

export const parseCategories = (catStr?: string | null): string[] => {
  if (!catStr) return [];
  try {
    const parsed = JSON.parse(catStr);
    if (Array.isArray(parsed)) return parsed.map((c) => String(c).trim()).filter(Boolean);
  } catch {}
  return catStr.split(',').map((c) => c.trim()).filter(Boolean);
};

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isSuperAdmin, isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [shops, setShops] = useState<Shop[]>([]);

  const fetchCategoriesData = async () => {
    try {
      const shopsData = await customerService.getShops();
      const loadedShops: Shop[] = Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []);
      setShops(loadedShops);
    } catch (err) {
      console.error('Error fetching categories data for Navbar:', err);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, [location.pathname]);

  const isStorePage = location.pathname.startsWith('/store/');
  const storeSlug = isStorePage
    ? location.pathname.replace('/store/', '').split('/')[0].split('?')[0]
    : null;
  const currentShop = storeSlug ? shops.find((s) => s.slug === storeSlug) : null;

  // Build categories to display: Show all store categories checked for this merchant store
  const displayedCategories: CategoryItem[] = React.useMemo(() => {
    // If viewing a specific merchant store (/store/:slug)
    if (currentShop) {
      const storeCats: CategoryItem[] = [
        { id: 'all', name: 'All Products', icon: Sparkles },
      ];

      // Take all store categories selected via checkbox for this merchant store
      const currentShopCats = parseCategories(currentShop.category);
      for (const cat of currentShopCats) {
        if (!storeCats.some((c) => c.id.toLowerCase() === cat.toLowerCase())) {
          storeCats.push({
            id: cat,
            name: cat,
            icon: getCategoryIcon(cat),
          });
        }
      }

      return storeCats;
    }

    // ALL STORES / MARKETPLACE: Show all store categories checked across active merchant stores
    const allCats: CategoryItem[] = [
      { id: 'all', name: 'All Products', icon: Sparkles },
    ];

    const merchantStoreCats = Array.from(
      new Set(
        shops
          .filter((s) => s.status !== 'inactive' && s.status !== 'archived')
          .flatMap((s) => parseCategories(s.category))
          .filter((c) => Boolean(c) && c.toLowerCase() !== 'general')
      )
    );

    for (const cat of merchantStoreCats) {
      if (!allCats.some((c) => c.id.toLowerCase() === cat.toLowerCase())) {
        allCats.push({
          id: cat,
          name: cat,
          icon: getCategoryIcon(cat),
        });
      }
    }

    return allCats;
  }, [currentShop, shops]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const currentCategory = searchParams.get('category')?.toLowerCase() || 'all';

  const handleCategoryClick = (categoryId: string) => {
    const isStorefront = location.pathname === '/' || location.pathname.startsWith('/store');
    const targetPath = isStorefront ? location.pathname : '/';

    const newParams = new URLSearchParams(searchParams);
    if (categoryId.toLowerCase() === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryId);
    }
    const searchStr = newParams.toString() ? `?${newParams.toString()}` : '';

    // If in a store and clicking a category belonging to a different merchant store, navigate to '/' marketplace
    if (
      currentShop &&
      categoryId.toLowerCase() !== 'all' &&
      currentShop.category?.toLowerCase() !== categoryId.toLowerCase()
    ) {
      navigate(`/${searchStr}`);
    } else {
      navigate(`${targetPath}${searchStr}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-all">
      {/* Primary Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              VORTEX
            </span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono uppercase tracking-wider">
              Market
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive('/') 
                ? 'bg-white/10 text-white font-semibold' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-400" />
            Storefront
          </Link>

          {isAuthenticated && (
            <Link
              to="/orders"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/orders') 
                  ? 'bg-white/10 text-white font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4 text-sky-400" />
              My Orders
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              to="/superadmin"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/superadmin') 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Platform Control
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/admin') 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              Merchant Portal
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Auth Info */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs text-white font-medium truncate max-w-[150px]">
                  {user.email}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold ${
                    user.role === 'superadmin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SECOND HEADER: Category Navigation Bar */}
      <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-4">
          {/* Scrollable category list */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-3 border-r border-white/10 shrink-0">
              {currentShop ? (
                <>
                  <Store className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300 max-w-[130px] truncate">{currentShop.name}</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Categories</span>
                </>
              )}
            </div>

            {displayedCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected =
                (currentCategory === 'all' && cat.id.toLowerCase() === 'all') ||
                (currentCategory.toLowerCase() === cat.id.toLowerCase());

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentShop ? `${currentShop.category || 'Store'} Category` : 'Live Catalog'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
