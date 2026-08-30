/**
 * Tempo Design System & Style Tokens
 * Strictly follows STANDARDS.md:
 * - Accent: #FF5800
 * - Strictly NO BORDERS (borderWidth: 0, no border colors)
 * - NO EMOJIS
 * - 100% Tokenized variables (no hardcoded literals)
 */

export const COLORS = {
  // Backgrounds
  bgPrimary: '#000000',
  bgSurface: '#121212',
  bgSurfaceSecondary: '#1C1C1E',
  bgPill: '#242426',
  bgHover: '#2C2C2E',
  bgOverlay: 'rgba(0, 0, 0, 0.55)',
  bgProgressTrack: '#2A2A2E',
  bgProgressInactive: 'rgba(255, 255, 255, 0.2)',
  bgActionBtn: '#18181A',
  bgActionBtnActive: '#2A201A',
  bgFollowActive: '#2A2A2E',
  bgGradientOverlay: 'rgba(0, 0, 0, 0.45)',
  bgNavCircle: 'rgba(0, 0, 0, 0.5)',
  bgCardDark: '#141416',
  bgCardAmber: '#161412',
  bgUpgradeCard: '#261912',       // Upgrade card dark warm background
  bgHeroGradientDeep: '#3D1500',  // Hero gradient top (deep dark orange-red)
  bgHeroGradientMid: '#1C120C',   // Hero gradient mid
  bgCardPlan: '#161618',          // Clean dark card for subscription plans
  bgCardPlanFeatured: '#22161A',  // Highlighted plan card with subtle tint
  whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
  whiteAlpha15: 'rgba(255, 255, 255, 0.15)',
  accentAlpha15: 'rgba(252, 71, 92, 0.15)',
  accentAlpha20: 'rgba(252, 71, 92, 0.2)',
  
  // Accents
  accentPrimary: '#FC475C',
  accentSecondary: '#FC655A',
  accentDark: '#7A1822',

  // Gradient stops (top → bottom: #FC475C → #FC655A)
  gradientTop: '#FC475C',
  gradientBottom: '#FC655A',

  // Genre & Ambient Tile Colors
  tileOrange: '#4A1220',
  tileSlate: '#1E2428',
  tilePurple: '#201A24',
  tileBrown: '#2C1D14',
  tileGreen: '#14261C',
  tileAmber: '#241E14',
  tileNavy: '#1A2228',
  tileBerry: '#261822',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#555558',
  textLightMuted: 'rgba(255, 255, 255, 0.7)',
  textLightMedium: 'rgba(255, 255, 255, 0.8)',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const LAYOUT = {
  // Radii
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
  
  // Borders (Strictly Zero Borders across the entire design)
  borderNone: 0,
  
  // Component Dimensions
  miniPlayerHeight: 62,
  tabBarHeight: 64,
  touchMin: 44,
  searchBarHeight: 46,
  genreCardHeight: 94,
  artworkHeroHeight: 320,
  
  // Element Sizes
  avatarSm: 44,
  avatarMd: 48,
  avatarLg: 60,
  avatarXl: 86,
  avatarHero: 200,
  
  iconButtonSm: 32,
  iconButtonMd: 36,
  iconButtonLg: 44,
  iconButtonXl: 56,
  iconButtonPlay: 68,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  screenPadding: 16,
  bottomPaddingOffset: 64,
};

export const TYPOGRAPHY = {
  // Font Sizes
  sizeHero: 28,
  sizeTitle: 24,
  sizeHeading: 20,
  sizeSubheading: 18,
  sizeBodyLarge: 16,
  sizeBody: 15,
  sizeBodySmall: 14,
  sizeSecondary: 13,
  sizeCaption: 12,
  sizeSmall: 11,
  sizeMicro: 10,
  sizeBadge: 9,

  // Line Heights
  lineHeightHero: 34,
  lineHeightTitle: 30,
  lineHeightHeading: 28,
  lineHeightBody: 22,
  lineHeightBodySmall: 20,
  lineHeightSecondary: 18,
  lineHeightCaption: 16,

  // Letter Spacing
  letterSpacingTight: 0.5,
  letterSpacingWide: 1.5,
  letterSpacingExtraWide: 2,
};
