export type ShopThemeId = 'cyber-neon' | 'luxury-gold' | 'sunset-flare';

export const ALLOWED_THEMES: readonly ShopThemeId[] = ['cyber-neon', 'luxury-gold', 'sunset-flare'] as const;

export function isValidTheme(theme: unknown): theme is ShopThemeId {
  return typeof theme === 'string' && ALLOWED_THEMES.includes(theme as ShopThemeId);
}
