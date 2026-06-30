/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const colors = {
  primary: '#6C63FF', // calming violet
  primaryDeep: '#5347E5',
  secondary: '#A1CFFF', // soft blue
  accent: '#76FF03', // green for tips / positive feedback
  backgroundLight: '#F5F7FA',
  backgroundDark: '#1E1F28',
  cardBg: '#FFFFFF',
  cardBgSecondary: '#E3F2FD', // secondary card color
  textDark: '#333',
  textLight: '#FFF',
 // ⚠ Emergency / Alert colors
  alertGradientStart: '#FF758C', // soft red/pink start
  alertGradientEnd: '#FF7EB3',   // soft red/pink end
  alertBtnBg: '#FF4D5A',         // button color
};

// ── Premium design tokens (additive — does not replace anything above) ───────
// Used by the new shared UI components (GradientHeader, GlassCard, StatCard,
// FloatingLabelInput, SegmentedControl, etc.) for a consistent 2026-style
// "premium SaaS" look across every screen.
export const gradients = {
  brand:     ['#6C63FF', '#A78BFA'] as [string, string],
  brandDeep: ['#5347E5', '#6C63FF'] as [string, string],
  rose:      ['#C2185B', '#E91E8C'] as [string, string],
  coral:     ['#FF758C', '#FF9AA2'] as [string, string],
  mint:      ['#34C77B', '#76C893'] as [string, string],
  sunset:    ['#FF8A65', '#FFB347'] as [string, string],
  ink:       ['#2D2B55', '#3F3D77'] as [string, string],
};

export const glass = {
  // Faux-glassmorphism surfaces (no native blur dependency installed) —
  // translucent fills + soft hairline borders read as "frosted" on top of
  // gradients/photos without needing expo-blur.
  light:        'rgba(255,255,255,0.16)',
  lightStrong:  'rgba(255,255,255,0.24)',
  border:       'rgba(255,255,255,0.32)',
  borderSoft:   'rgba(255,255,255,0.18)',
  surface:      'rgba(255,255,255,0.92)', // for glass cards over light backgrounds
  surfaceBorder:'rgba(255,255,255,0.6)',
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  card: {
    shadowColor: '#6C63FF', shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  glow: {
    shadowColor: '#6C63FF', shadowOpacity: 0.28, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
};

export const semantic = {
  success: '#2ECC71',
  warning: '#FFA726',
  error:   '#FF4D5A',
  info:    '#4FC3F7',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
