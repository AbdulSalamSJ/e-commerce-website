import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  TrendingUp, 
  ShieldCheck, 
  ShoppingBag, 
  Store,
  Palette,
  ExternalLink,
  Edit3,
  Tag,
  Check,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { superAdminService, Shop } from '../services/api';
import { useToast } from '../context/ToastContext';
import { THEME_LIST, getThemeConfig, ShopThemeId } from '../types/theme';
import { parseCategories } from '../components/Navbar';

export const PRESET_CATEGORIES = [
  'Electronics & Tech',
  'Fashion & Apparel',
  'Luxury & Jewelry',
  'Gaming & VR',
  'Home & Living',
  'Health & Beauty',
  'Sports & Outdoors',
  'Art & Collectibles',
  'Food & Gourmet',
  'Books & Media',
];

interface AdminUser {
  id: string;
  email: string;
  role: string;
  shopId: string;
  createdAt: string;
}

interface OverviewData {
  totalShops: number;
  totalAdmins: number;
  totalCustomers: number;
  totalOrders: number;
}

interface CategoryCheckboxDropdownProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  availableCategories: string[];
  onAddNewCategory: (newCategory: string) => void;
  onRemoveCategory?: (category: string) => void;
}

export const CategoryCheckboxDropdown: React.FC<CategoryCheckboxDropdownProps> = ({
  selectedCategories,
  onChange,
  availableCategories,
  onAddNewCategory,
  onRemoveCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      onChange(selectedCategories.filter((c) => c !== cat));
    } else {
      onChange([...selectedCategories, cat]);
    }
  };

  const handleAddNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    parts.forEach((p) => onAddNewCategory(p));
    const newSelected = Array.from(new Set([...selectedCategories, ...parts]));
    onChange(newSelected);
    setNewCatInput('');
  };

  const filteredCategories = availableCategories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Toggle Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-purple-500/50 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner flex items-center justify-between gap-2 transition-all"
      >
        <div className="flex items-center gap-1.5 flex-wrap flex-1 text-left">
          {selectedCategories.length === 0 ? (
            <span className="text-slate-400 text-xs italic">Click to select store categories...</span>
          ) : (
            selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(cat);
                }}
              >
                <span>{cat}</span>
                <X className="w-3 h-3 hover:text-white cursor-pointer" />
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            {selectedCategories.length} selected
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Dropdown Menu with Checkboxes */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl space-y-3">
          {/* Header & Quick Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Select Store Categories (Will appear in Second Header)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedCategories.length === availableCategories.length) {
                    onChange([]);
                  } else {
                    onChange([...availableCategories]);
                  }
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {selectedCategories.length === availableCategories.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search available categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Scrollable Checkbox List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No matching categories found
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isChecked = selectedCategories.includes(cat);
                return (
                  <div
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200 font-semibold'
                        : 'hover:bg-white/5 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer accent-purple-500"
                      />
                      <span className="text-xs">{cat}</span>
                    </div>

                    {onRemoveCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCategory(cat);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title={`Remove "${cat}" from list`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Category Section */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              placeholder="+ Add new category..."
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
            <button
              type="button"
              onClick={() => handleAddNew()}
              disabled={!newCatInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SuperAdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isShopModalFullScreen, setIsShopModalFullScreen] = useState(false);
  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [isEditModalFullScreen, setIsEditModalFullScreen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Category Management
  const [availableCategories, setAvailableCategories] = useState<string[]>(PRESET_CATEGORIES);

  // Shop Form (New)
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategories, setShopCategories] = useState<string[]>(['Electronics & Tech']);
  const [shopTheme, setShopTheme] = useState<ShopThemeId>('cyber-neon');
  const [submittingShop, setSubmittingShop] = useState(false);

  // Shop Form (Edit existing)
  const [editingShopId, setEditingShopId] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editShopSlug, setEditShopSlug] = useState('');
  const [editShopDescription, setEditShopDescription] = useState('');
  const [editShopCategories, setEditShopCategories] = useState<string[]>([]);
  const [editShopTheme, setEditShopTheme] = useState<ShopThemeId>('cyber-neon');
  const [editShopStatus, setEditShopStatus] = useState<string>('active');
  const [submittingEditShop, setSubmittingEditShop] = useState(false);

  // Admin Form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminShopId, setAdminShopId] = useState('');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovData, shopsData, adminsData] = await Promise.all([
        superAdminService.getOverview(),
        superAdminService.getShops(),
        superAdminService.getAdmins(),
      ]);
      setOverview(ovData?.metrics || ovData || null);
      const fetchedShops = Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []);
      setShops(fetchedShops);
      setAdmins(Array.isArray(adminsData) ? adminsData : (adminsData?.admins || []));

      // Merge dynamic categories from DB shops
      const dynamicCats = fetchedShops
        .flatMap((s: any) => parseCategories(s.category))
        .filter((c: any) => Boolean(c) && c !== 'General');

      setAvailableCategories((prev) => {
        const merged = [...prev];
        for (const cat of dynamicCats) {
          if (!merged.some((m) => m.toLowerCase() === cat.toLowerCase())) {
            merged.push(cat);
          }
        }
        return merged;
      });
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !shopSlug) {
      error('Shop name and URL slug are required');
      return;
    }

    setSubmittingShop(true);
    try {
      const finalCategory = shopCategories.length > 0 ? shopCategories.join(', ') : 'General';
      await superAdminService.createShop({
        name: shopName,
        slug: shopSlug.toLowerCase().trim().replace(/\s+/g, '-'),
        description: shopDescription,
        category: finalCategory,
        theme: shopTheme,
      });
      success(`Shop "${shopName}" (${finalCategory}) onboarded with theme "${getThemeConfig(shopTheme).badgeText}"!`);
      setIsShopModalOpen(false);
      setShopName('');
      setShopSlug('');
      setShopDescription('');
      setShopCategories(['Electronics & Tech']);
      setShopTheme('cyber-neon');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to onboard shop');
    } finally {
      setSubmittingShop(false);
    }
  };

  const handleUpdateShopTheme = async (shopId: string, newTheme: ShopThemeId, name: string) => {
    try {
      await superAdminService.updateShop(shopId, { theme: newTheme });
      success(`Updated theme for "${name}" to ${getThemeConfig(newTheme).badgeText}`);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update shop theme');
    }
  };

  const openEditShopModal = (s: Shop) => {
    setEditingShopId(s.id);
    setEditShopName(s.name);
    setEditShopSlug(s.slug);
    setEditShopDescription(s.description || '');
    const parsedCats = parseCategories(s.category);
    setEditShopCategories(parsedCats.length > 0 ? parsedCats : ['General']);
    setAvailableCategories((prev) => {
      const merged = [...prev];
      for (const cat of parsedCats) {
        if (!merged.some((c) => c.toLowerCase() === cat.toLowerCase())) {
          merged.push(cat);
        }
      }
      return merged;
    });
    setEditShopTheme((s.theme || 'cyber-neon') as ShopThemeId);
    setEditShopStatus(s.status || 'active');
    setIsEditShopModalOpen(true);
  };

  const handleSaveEditShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShopName.trim()) {
      error('Shop name is required');
      return;
    }

    setSubmittingEditShop(true);
    try {
      const finalCategory = editShopCategories.length > 0 ? editShopCategories.join(', ') : 'General';

      await superAdminService.updateShop(editingShopId, {
        name: editShopName.trim(),
        description: editShopDescription.trim() || null,
        category: finalCategory,
        theme: editShopTheme,
        status: editShopStatus,
      });

      // Immediately update local shops state so all changes reflect without delay
      setShops((prev) =>
        prev.map((s) =>
          s.id === editingShopId
            ? {
                ...s,
                name: editShopName.trim(),
                description: editShopDescription.trim() || null,
                category: finalCategory,
                theme: editShopTheme,
                status: editShopStatus,
              }
            : s
        )
      );

      success(`Changes saved and applied to "${editShopName.trim()}"!`);
      setIsEditShopModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update store');
    } finally {
      setSubmittingEditShop(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword || !adminShopId) {
      error('Email, password, and shop assignment are all required');
      return;
    }

    setSubmittingAdmin(true);
    try {
      await superAdminService.createAdmin({
        email: adminEmail,
        password: adminPassword,
        shopId: adminShopId,
      });
      success(`Admin for ${adminEmail} created and assigned!`);
      setIsAdminModalOpen(false);
      setAdminEmail('');
      setAdminPassword('');
      setAdminShopId('');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to create merchant admin');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This removes all associated products.`)) {
      return;
    }

    try {
      await superAdminService.deleteShop(id);
      success(`Shop "${name}" deleted`);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Could not delete shop');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!window.confirm(`Revoke admin access for ${email}?`)) {
      return;
    }

    try {
      await superAdminService.deleteAdmin(id);
      success(`Admin ${email} removed`);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Could not remove admin');
    }
  };

  const getShopNameById = (sId: string) => {
    const s = shops.find((item) => item.id === sId);
    return s ? s.name : 'Unknown Shop';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super-Administrator Tier
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Platform Operations & Multi-Tenancy
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision independent vendor storefronts and assign authorized merchant admins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShopModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Store
          </button>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            disabled={shops.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Assign Admin
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Shops</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview?.totalShops ?? 0}
          </div>
          <div className="text-xs text-purple-400/80 mt-1">Active platform tenancies</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Merchant Admins</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview?.totalAdmins ?? 0}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">Shop management roles</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Registered Customers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview?.totalCustomers ?? 0}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Verified shopper accounts</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">System Orders</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview?.totalOrders ?? 0}
          </div>
          <div className="text-xs text-sky-400/80 mt-1">Cross-shop checkouts</div>
        </div>
      </div>

      {/* Main Content Grid: Shops & Admins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shops Management */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Merchant Stores ({shops.length})</h2>
            </div>
            <button
              onClick={() => setIsShopModalOpen(true)}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Store
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto">
            {shops.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No stores registered yet. Click "Onboard Shop" to create your first vendor.
              </div>
            ) : (
              shops.map((s) => {
                const themeConfig = getThemeConfig(s.theme);
                return (
                  <div key={s.id} className="py-3.5 flex items-center justify-between group">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openEditShopModal(s)}
                          className="font-semibold text-white hover:text-purple-300 text-left truncate text-sm transition-colors cursor-pointer flex items-center gap-1"
                          title="Click to edit store information & theme"
                        >
                          {s.name}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-mono">
                          /{s.slug}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditShopModal(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 cursor-pointer hover:opacity-90 ${themeConfig.pillBadgeClass}`}
                          title="Click to change theme"
                        >
                          <Palette className="w-2.5 h-2.5" />
                          {themeConfig.badgeText}
                        </button>
                        {parseCategories(s.category).map((cat) => (
                          <span 
                            key={cat}
                            onClick={() => openEditShopModal(s)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                            title="Store Category (Click to edit)"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {cat}
                          </span>
                        ))}
                        {s.status === 'suspended' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm">
                        {s.description || 'No description provided'}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditShopModal(s)}
                          className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Details & Theme
                        </button>
                        <span className="text-slate-600">•</span>
                        <a
                          href={`/store/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Visit Storefront
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditShopModal(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Edit Store Information & Theme"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit</span>
                      </button>

                      {/* Theme quick switcher */}
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        <Palette className="w-3 h-3 text-slate-400" />
                        <select
                          value={s.theme || 'cyber-neon'}
                          onChange={(e) => handleUpdateShopTheme(s.id, e.target.value as ShopThemeId, s.name)}
                          className="text-xs bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                          title="Change assigned theme"
                        >
                          {THEME_LIST.map((th) => (
                            <option key={th.id} value={th.id} className="bg-slate-900 text-white">
                              {th.badgeText}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleDeleteShop(s.id, s.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Shop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Admins Management */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Shop Administrators ({admins.length})</h2>
            </div>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              disabled={shops.length === 0}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Assign Admin
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto">
            {admins.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No merchant admins created yet.
              </div>
            ) : (
              admins.map((adm) => (
                <div key={adm.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{adm.email}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-amber-400 font-medium">
                        Assigned to: {getShopNameById(adm.shopId)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove Admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Onboard Shop */}
      {isShopModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm ${isShopModalFullScreen ? 'p-2 sm:p-4' : 'p-4'}`}>
          <div className={`w-full glass-panel border border-white/10 shadow-2xl animate-modal-in overflow-y-auto transition-all duration-200 ${
            isShopModalFullScreen 
              ? 'h-[96vh] max-w-5xl rounded-2xl p-6 sm:p-8' 
              : 'max-w-xl max-h-[92vh] rounded-2xl p-6'
          }`}>
            <div className="flex items-start justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-400" />
                  Onboard New Merchant Store
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Establish a dedicated multi-tenant entity for selling products.
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-4">
                <button
                  type="button"
                  onClick={() => setIsShopModalFullScreen(!isShopModalFullScreen)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isShopModalFullScreen ? "Exit Full Screen" : "Show Full Screen"}
                >
                  {isShopModalFullScreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Normal Size</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Full Screen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsShopModalOpen(false);
                    setIsShopModalFullScreen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-4">
              {/* 1. First Field: Shop Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  1. Shop Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberHub Gear"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (!shopSlug) {
                      setShopSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 2. Second Field: Store URL Slug */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  2. Store URL Slug <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden px-3">
                  <span className="text-xs text-slate-500">domain.com/store/</span>
                  <input
                    type="text"
                    required
                    placeholder="cyberhub"
                    value={shopSlug}
                    onChange={(e) => setShopSlug(e.target.value)}
                    className="w-full py-2 bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Third Field: Description (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  3. Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Premium electronics and bespoke gadgets..."
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4. Fourth Field: Store Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  4. Store Category (Select via Checkboxes) <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Click the dropdown list to check the categories that will appear in this shop's second header.
                </p>
                <CategoryCheckboxDropdown
                  selectedCategories={shopCategories}
                  onChange={setShopCategories}
                  availableCategories={availableCategories}
                  onAddNewCategory={(newCat) => {
                    setAvailableCategories((prev) => 
                      prev.some((c) => c.toLowerCase() === newCat.toLowerCase()) ? prev : [newCat, ...prev]
                    );
                  }}
                  onRemoveCategory={(cat) => {
                    setAvailableCategories((prev) => prev.filter((c) => c !== cat));
                    setShopCategories((prev) => prev.filter((c) => c !== cat));
                  }}
                />
              </div>

              {/* 5. Fifth Field: Store Theme & Dropdown Selection Box */}
              <div>
                <label htmlFor="store-theme-select" className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    5. Store Theme
                  </span>
                  <span className="text-[11px] text-purple-300 font-mono">Select theme from dropdown</span>
                </label>

                {/* Dropdown Box to select theme */}
                <select
                  id="store-theme-select"
                  value={shopTheme}
                  onChange={(e) => setShopTheme(e.target.value as ShopThemeId)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner transition-colors"
                >
                  {THEME_LIST.map((th) => (
                    <option key={th.id} value={th.id} className="bg-slate-900 text-white py-1">
                      {th.name}
                    </option>
                  ))}
                </select>

                {/* Theme Visual Preview Box for this Particular Shop */}
                {(() => {
                  const activeTh = getThemeConfig(shopTheme);
                  return (
                    <div className="mt-2.5 p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.primaryColor }}
                            title={`Primary Color: ${activeTh.primaryColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.accentColor }}
                            title={`Accent Color: ${activeTh.accentColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.bgDark }}
                            title={`Canvas Background: ${activeTh.bgDark}`}
                          />
                          <span className="text-xs font-bold text-white ml-1">
                            {activeTh.badgeText}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activeTh.pillBadgeClass}`}>
                          Theme To Apply
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {activeTh.description}
                      </p>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Palette Tone:</span>
                        <span className="font-mono text-[10px] text-purple-300">{activeTh.tagline}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsShopModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingShop}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {submittingShop ? 'Applying Theme & Creating...' : 'Create Store & Apply Theme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Shop & Theme */}
      {isEditShopModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm ${isEditModalFullScreen ? 'p-2 sm:p-4' : 'p-4'}`}>
          <div className={`w-full glass-panel border border-white/10 shadow-2xl animate-modal-in overflow-y-auto transition-all duration-200 ${
            isEditModalFullScreen 
              ? 'h-[96vh] max-w-5xl rounded-2xl p-6 sm:p-8' 
              : 'max-w-xl max-h-[92vh] rounded-2xl p-6'
          }`}>
            <div className="flex items-start justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  Edit Store Information & Theme
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update store details, status, or reassign visual theme for this shop.
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalFullScreen(!isEditModalFullScreen)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isEditModalFullScreen ? "Exit Full Screen" : "Show Full Screen"}
                >
                  {isEditModalFullScreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Normal Size</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Full Screen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditShopModalOpen(false);
                    setIsEditModalFullScreen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditShop} className="space-y-4">
              {/* 1. Shop Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  1. Shop Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 2. Store URL Slug */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  2. Store URL Slug (Unique Identifier)
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden px-3 py-2 text-slate-400 text-sm font-mono">
                  <span className="text-xs text-slate-500">domain.com/store/</span>
                  <span className="text-white font-semibold ml-1">{editShopSlug}</span>
                </div>
              </div>

              {/* 3. Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  3. Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Boutique description..."
                  value={editShopDescription}
                  onChange={(e) => setEditShopDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4. Store Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  4. Store Category (Select via Checkboxes) <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Click the dropdown list to check the categories that will appear in this shop's second header.
                </p>
                <CategoryCheckboxDropdown
                  selectedCategories={editShopCategories}
                  onChange={setEditShopCategories}
                  availableCategories={availableCategories}
                  onAddNewCategory={(newCat) => {
                    setAvailableCategories((prev) => 
                      prev.some((c) => c.toLowerCase() === newCat.toLowerCase()) ? prev : [newCat, ...prev]
                    );
                  }}
                  onRemoveCategory={(cat) => {
                    setAvailableCategories((prev) => prev.filter((c) => c !== cat));
                    setEditShopCategories((prev) => prev.filter((c) => c !== cat));
                  }}
                />
              </div>

              {/* 5. Fifth Field: Store Theme Dropdown Box */}
              <div>
                <label htmlFor="edit-store-theme-select" className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    5. Store Theme
                  </span>
                  <span className="text-[11px] text-purple-300 font-mono">Select theme from dropdown</span>
                </label>

                {/* Dropdown Box to select theme */}
                <select
                  id="edit-store-theme-select"
                  value={editShopTheme}
                  onChange={(e) => setEditShopTheme(e.target.value as ShopThemeId)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner transition-colors"
                >
                  {THEME_LIST.map((th) => (
                    <option key={th.id} value={th.id} className="bg-slate-900 text-white py-1">
                      {th.name}
                    </option>
                  ))}
                </select>

                {/* Theme Visual Preview Box for this Particular Shop */}
                {(() => {
                  const activeTh = getThemeConfig(editShopTheme);
                  return (
                    <div className="mt-2.5 p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.primaryColor }}
                            title={`Primary Color: ${activeTh.primaryColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.accentColor }}
                            title={`Accent Color: ${activeTh.accentColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/15 shadow-sm"
                            style={{ backgroundColor: activeTh.bgDark }}
                            title={`Canvas Background: ${activeTh.bgDark}`}
                          />
                          <span className="text-xs font-bold text-white ml-1">
                            {activeTh.badgeText}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activeTh.pillBadgeClass}`}>
                          Selected Theme
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {activeTh.description}
                      </p>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Palette Tone:</span>
                        <span className="font-mono text-[10px] text-purple-300">{activeTh.tagline}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 6. Store Status */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  6. Store Status
                </label>
                <select
                  value={editShopStatus}
                  onChange={(e) => setEditShopStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="active">Active (Visible on public marketplace)</option>
                  <option value="suspended">Suspended (Access restricted)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditShopModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditShop}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {submittingEditShop ? 'Saving & Applying...' : 'Save & Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Admin */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl animate-modal-in">
            <h3 className="text-xl font-bold text-white mb-2">Create & Assign Merchant Admin</h3>
            <p className="text-xs text-slate-400 mb-6">
              Create an administrative user restricted strictly to managing their assigned shop.
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@shopname.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to Store</label>
                <select
                  required
                  value={adminShopId}
                  onChange={(e) => setAdminShopId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select a store...</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 disabled:opacity-50"
                >
                  {submittingAdmin ? 'Provisioning...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
