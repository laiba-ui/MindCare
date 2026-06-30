// components/ui/GlassCard.tsx
// Faux-glassmorphism surface (no expo-blur dependency available in this
// project) — a translucent fill + soft hairline border + lifted shadow reads
// as "frosted glass" sitting on top of a gradient or photo background.

import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { glass, radii } from '@/constants/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** 'onGradient' = translucent white on a colored/gradient backdrop. 'onLight' = solid frosted card on a light page background. */
  variant?: 'onGradient' | 'onLight';
};

export default function GlassCard({ children, style, variant = 'onGradient' }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'onGradient' ? styles.onGradient : styles.onLight,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  onGradient: {
    backgroundColor: glass.light,
    borderColor: glass.border,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as any) : {}),
  },
  onLight: {
    backgroundColor: glass.surface,
    borderColor: glass.surfaceBorder,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)' } as any) : {}),
  },
});
