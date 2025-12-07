/**
 * Application Theme Configuration
 * Defines the color palette and typography for the app in both light and dark modes.
 */

import { Platform } from 'react-native';

// Brand Palette - Medical Teal/Blue Theme
const Palette = {
  primary: '#0D9488', // Teal 600 - Trustworthy, Medical
  primaryDark: '#2DD4BF', // Teal 400 - Brighter for dark mode
  secondary: '#64748B', // Slate 500
  secondaryDark: '#94A3B8', // Slate 400
  backgroundLight: '#FFFFFF',
  backgroundDark: '#111827', // Gray 900
  surfaceLight: '#F3F4F6', // Gray 100
  surfaceDark: '#1F2937', // Gray 800
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const tintColorLight = Palette.primary;
const tintColorDark = Palette.primaryDark;

export const Colors = {
  light: {
    text: '#11181C',
    background: Palette.backgroundLight,
    surface: Palette.surfaceLight,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: Palette.primary,
    secondary: Palette.secondary,
    accent: Palette.warning,
    error: Palette.error,
    success: Palette.success,
    border: '#E5E7EB',
  },
  dark: {
    text: '#ECEDEE',
    background: Palette.backgroundDark,
    surface: Palette.surfaceDark,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: Palette.primaryDark,
    secondary: Palette.secondaryDark,
    accent: Palette.warning,
    error: Palette.error,
    success: Palette.success,
    border: '#374151',
  },
};

export const Typography = {
  fontFamily: 'System', // Use system default for best native feel
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#6B7280',
  },
};