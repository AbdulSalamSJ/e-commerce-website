export type ShopThemeId = 'cyber-neon' | 'luxury-gold' | 'sunset-flare';

export interface ThemeConfig {
  id: ShopThemeId;
  name: string;
  badgeText: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgDark: string;
  previewColors: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    text: string;
  };
  pillBadgeClass: string;
  accentBorderClass: string;
  buttonClass: string;
}

export const SHOP_THEMES: Record<ShopThemeId, ThemeConfig> = {
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon (High-Tech & Gaming)',
    badgeText: 'Cyber Neon',
    tagline: 'Obsidian Canvas & Electric Emerald / Cyan Glow',
    description: 'Ultra-modern, dark cyberpunk vibe designed for electronics, gaming, tech hardware, and futuristic digital gear.',
    primaryColor: '#10b981',
    accentColor: '#06b6d4',
    bgDark: '#080c14',
    previewColors: {
      bg: '#080c14',
      card: '#0f172a',
      primary: '#10b981',
      accent: '#06b6d4',
      text: '#f8fafc',
    },
    pillBadgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    accentBorderClass: 'border-emerald-500/40 hover:border-emerald-400',
    buttonClass: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/25',
  },
  'luxury-gold': {
    id: 'luxury-gold',
    name: 'Royal Luxe (Champagne Gold & Opulence)',
    badgeText: 'Royal Luxe',
    tagline: 'Warm Caviar Canvas & Radiant Champagne Gold',
    description: 'Prestigious boutique aesthetic designed for fine jewelry, designer apparel, luxury watches, and high-end artisanal brands.',
    primaryColor: '#f59e0b',
    accentColor: '#fbbf24',
    bgDark: '#0c0a09',
    previewColors: {
      bg: '#0c0a09',
      card: '#1c1917',
      primary: '#f59e0b',
      accent: '#fbbf24',
      text: '#fef3c7',
    },
    pillBadgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/35',
    accentBorderClass: 'border-amber-500/40 hover:border-amber-400',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 font-bold shadow-lg shadow-amber-500/25',
  },
  'sunset-flare': {
    id: 'sunset-flare',
    name: 'Solar Sunset (Vibrant Rose & Coral Flare)',
    badgeText: 'Solar Sunset',
    tagline: 'Midnight Violet Canvas & Radiant Sunset Crimson',
    description: 'Bold, energetic, and expressive design tailored for fashion, lifestyle, cosmetics, creative studios, and youth streetwear.',
    primaryColor: '#f43f5e',
    accentColor: '#8b5cf6',
    bgDark: '#0f0d1a',
    previewColors: {
      bg: '#0f0d1a',
      card: '#1a1329',
      primary: '#f43f5e',
      accent: '#8b5cf6',
      text: '#fff1f2',
    },
    pillBadgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/35',
    accentBorderClass: 'border-rose-500/40 hover:border-rose-400',
    buttonClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white hover:opacity-95 font-bold shadow-lg shadow-rose-500/25',
  },
};

export const THEME_LIST = Object.values(SHOP_THEMES);

export function getThemeConfig(themeId?: string | null): ThemeConfig {
  if (themeId && themeId in SHOP_THEMES) {
    return SHOP_THEMES[themeId as ShopThemeId];
  }
  return SHOP_THEMES['cyber-neon'];
}
