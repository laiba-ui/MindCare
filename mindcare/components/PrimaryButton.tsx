// components/PrimaryButton.tsx
// Reusable gradient CTA button used across auth screens.
// - Scales down slightly on press (native + web)
// - Lifts with a soft shadow glow on web hover
// - Shows a spinner + custom label while `loading` is true
// Purely presentational — callers keep their own onPress / validation logic.

import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

type Props = {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  colors?: [string, string, ...string[]];
  icon?: ReactNode;
  style?: any;
};

export default function PrimaryButton({
  label, loadingLabel, loading, disabled, onPress,
  colors = ['#6C63FF', '#A78BFA'], icon, style,
}: Props) {
  const scale = useSharedValue(1);
  const [hovered, setHovered] = useState(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = !!disabled || !!loading;

  return (
    <Animated.View
      style={[
        styles.wrap,
        animStyle,
        style,
        Platform.OS === 'web' && hovered && !isDisabled ? styles.webHover : null,
      ]}
    >
      <Pressable
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        onPress={onPress}
        disabled={isDisabled}
        // @ts-ignore — web-only hover events, harmlessly ignored on native
        onHoverIn={() => setHovered(true)}
        // @ts-ignore
        onHoverOut={() => setHovered(false)}
        android_ripple={{ color: 'rgba(255,255,255,0.25)', foreground: true }}
        style={{ opacity: isDisabled ? 0.85 : 1 }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.grad}
        >
          {loading ? (
            <View style={styles.row}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.text}>{loadingLabel || 'Please wait...'}</Text>
            </View>
          ) : (
            <View style={styles.row}>
              {icon}
              <Text style={styles.text}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', marginBottom: spacing.lg },
  webHover: {
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(108,99,255,0.35)' } as any)
      : {}),
  },
  grad: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: wp(4.5), fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});
