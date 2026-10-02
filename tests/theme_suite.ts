import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidTheme, ALLOWED_THEMES } from '../src/types/theme.js';

test('Theme System: Validates allowed theme IDs', () => {
  assert.equal(isValidTheme('cyber-neon'), true);
  assert.equal(isValidTheme('luxury-gold'), true);
  assert.equal(isValidTheme('sunset-flare'), true);
  assert.equal(isValidTheme('invalid-theme'), false);
  assert.equal(isValidTheme(''), false);
  assert.equal(isValidTheme(null), false);
  assert.equal(isValidTheme(123), false);

  assert.equal(ALLOWED_THEMES.length, 3);
  assert.deepEqual(Array.from(ALLOWED_THEMES), ['cyber-neon', 'luxury-gold', 'sunset-flare']);
});

test('Theme System: Default theme assignment fallback', () => {
  const sanitizeTheme = (t: unknown) => (isValidTheme(t) ? t : 'cyber-neon');
  assert.equal(sanitizeTheme('luxury-gold'), 'luxury-gold');
  assert.equal(sanitizeTheme('sunset-flare'), 'sunset-flare');
  assert.equal(sanitizeTheme(undefined), 'cyber-neon');
  assert.equal(sanitizeTheme('unknown'), 'cyber-neon');
});
