export const BRAND_COLORS = {
  navyDark: '#021E32',
  oceanDeep: '#062C45',
  glacier: '#247CA8',
  cyanIce: '#55C2E8',
  icePale: '#C6E8F5',
  snowWhite: '#F7FBFD',
  signalCoral: '#FF5A5F',
  borderNavy: 'rgba(85, 194, 232, 0.18)',
  cardBg: '#062C45',
  cardBgLight: '#0A3652',
  overlayTrans: 'rgba(2, 30, 50, 0.88)',
};

export const SOUND_SIGHT_THEME = {
  colors: {
    background: BRAND_COLORS.navyDark,
    surface: '#062C45',
    surfaceRaised: '#0A3652',
    accent: BRAND_COLORS.cyanIce,
    accentMuted: BRAND_COLORS.glacier,
    text: BRAND_COLORS.snowWhite,
    textMuted: BRAND_COLORS.icePale,
    textSecondary: '#A9C6D8',
    muted: '#6F93A8',
    success: '#20D6B5',
    separator: 'rgba(85, 194, 232, 0.18)',
  },
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, hero: 48 },
  radius: { control: 12, card: 18, sheet: 28, round: 999 },
  type: { hero: 32, screen: 28, section: 19, row: 16, body: 14, meta: 12 },
} as const;

export const CATEGORY_META = {
  safety: {
    label: 'Safety & Emergency',
    shortLabel: 'Safety',
    color: '#FF5A5F',
    bgColor: 'rgba(255, 90, 95, 0.15)',
    borderColor: '#FF5A5F',
  },
  speech: {
    label: 'Speech & Voices',
    shortLabel: 'Speech',
    color: '#55C2E8',
    bgColor: 'rgba(85, 194, 232, 0.15)',
    borderColor: '#55C2E8',
  },
  household: {
    label: 'Household & Appliances',
    shortLabel: 'Household',
    color: '#C6E8F5',
    bgColor: 'rgba(198, 232, 245, 0.15)',
    borderColor: '#247CA8',
  },
  outdoor: {
    label: 'Outdoor & Traffic',
    shortLabel: 'Outdoor',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#247CA8',
  },
};
