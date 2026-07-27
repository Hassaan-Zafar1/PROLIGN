// Theme tokens copied 1:1 from the web frontend (src/index.css @theme block).
// Material-3 style "earthy green" palette + Playfair Display / Source Sans 3.

export const colors = {
  // Primary (deep forest green)
  primary: '#1a280a',
  onPrimary: '#ffffff',
  primaryContainer: '#2e3d1c',
  onPrimaryContainer: '#b8d08c',
  inversePrimary: '#c8dca8',

  // Secondary (moss)
  secondary: '#4a5a2a',
  onSecondary: '#ffffff',
  secondaryContainer: '#d8e4ac',
  onSecondaryContainer: '#3a4820',

  // Tertiary (warm brown)
  tertiary: '#312403',
  onTertiary: '#ffffff',
  tertiaryContainer: '#493a16',
  onTertiaryContainer: '#baa477',

  // Semantic
  success: '#2a7a30',
  successContainer: '#a8dcaa',
  onSuccessContainer: '#1a5a1e',
  error: '#c62828',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#8a0010',
  warning: '#d48a20',
  info: '#3880b0',

  // Background & surfaces
  background: '#f5f3ee',
  onBackground: '#1c1a16',
  surface: '#faf8f5',
  onSurface: '#1c1a16',
  surfaceDim: '#e2ded5',
  surfaceBright: '#faf8f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f0e9',
  surfaceContainer: '#ebe7dc',
  surfaceContainerHigh: '#e3ded0',
  surfaceContainerHighest: '#d9d3c4',
  surfaceVariant: '#e4dcc8',
  onSurfaceVariant: '#5a574a',

  outline: '#7a7668',
  outlineVariant: '#c8c2b2',

  // Fixed / accents
  primaryFixed: '#dae8c0',
  onPrimaryFixed: '#151f06',
  secondaryFixed: '#e0e8b8',
  tertiaryFixed: '#f8e0ae',

  bone: '#dfd6c8',
  statusPending: '#CFBB99',
  white: '#ffffff',
};

export const fonts = {
  // Playfair Display — headlines
  serifBold: 'PlayfairDisplay_700Bold',
  serifSemi: 'PlayfairDisplay_600SemiBold',
  // Source Sans 3 — body / UI
  body: 'SourceSans3_400Regular',
  bodySemi: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const spacing = (n) => n * 4;

// Soft, natural shadow (matches .natural-shadow / shadow-sm feel)
export const shadow = {
  shadowColor: '#1c1a16',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
export const shadowSm = {
  shadowColor: '#1c1a16',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

export default { colors, fonts, radius, spacing, shadow, shadowSm };
