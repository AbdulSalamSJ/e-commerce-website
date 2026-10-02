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
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { customerService } from '../services/api';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All Products', icon: Sparkles },
  { id: 'Audio', name: 'Audio', icon: Headphones },
  { id: 'Gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'Displays', name: 'Displays', icon: Monitor },
  { id: 'Watches', name: 'Watches', icon: Watch },
  { id: 'Jewelry', name: 'Jewelry', icon: Gem },
  { id: 'Apparel', name: 'Apparel', icon: Shirt },
  { id: 'Electronics', name: 'Electronics', icon: Cpu },
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isSuperAdmin, isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Dynamically fetch any additional categories from catalog products
    customerService.getProducts()
      .then((res) => {
        const prods = Array.isArray(res) ? res : res?.products || [];
        const dbCategories = Array.from(
          new Set(prods.map((p: any) => p.category).filter(Boolean))
        ) as string[];

        setCategories((prev) => {
          const merged = [...prev];
          for (const cat of dbCategories) {
            if (!merged.some((m) => m.id.toLowerCase() === cat.toLowerCase())) {
              merged.push({ id: cat, name: cat, icon: Tag });
            }
          }
          return merged;
        });
      })
      .catch((err) => {
        console.error('Error fetching categories for second header:', err);
      });
  }, []);

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
    navigate(`${targetPath}${searchStr}`);
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
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Categories</span>
            </div>

            {categories.map((cat) => {
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
              Live Catalog
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
