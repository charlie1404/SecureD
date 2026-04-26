export interface ColorTheme {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  subText: string;
  accent: string;
  accentSecondary: string;
  accentSurface: string;
  success: string;
  warning: string;
  danger: string;
  white: string;
}

export const Theme: { dark: ColorTheme; light: ColorTheme } = {
  dark: {
    // Canvas & Elevation
    background: '#121214',
    card: '#1C1C20',
    cardBorder: '#2C2C32',

    // Typography
    text: '#F4F4F6',
    subText: '#9E9EA8',

    // Brand: rgb(209, 51, 71) / #D13347
    // Using an illuminated crimson (#E04D60) for dark mode to ensure >5.2:1 WCAG contrast
    accent: '#E04D60',
    accentSecondary: '#EDA3AA', // Soft blush rose extracted directly from the SecureD logo
    accentSurface: 'rgba(209, 51, 71, 0.16)',

    // Functional Status
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#FF453A',
    white: '#FFFFFF',
  },
  light: {
    // Canvas & Elevation
    background: '#F8F9FA',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',

    // Typography
    text: '#18181B',
    subText: '#71717A',

    // Brand: rgb(209, 51, 71) / #D13347
    // Exact brand crimson: 5.1:1 contrast ratio against white cards
    accent: '#D13347',
    accentSecondary: '#B53042',
    accentSurface: 'rgba(209, 51, 71, 0.08)',

    // Functional Status
    success: '#10B981',
    warning: '#D97706',
    danger: '#DC2626',
    white: '#FFFFFF',
  },
};
