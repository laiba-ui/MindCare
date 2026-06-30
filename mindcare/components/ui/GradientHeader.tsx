// components/ui/GradientHeader.tsx
// Shared premium header used across inner pages — replaces the near-identical
// LinearGradient + back-button + title markup that was copy/pasted into ~15
// screens. One component = consistent spacing, consistent press feedback,
// consistent entrance animation everywhere it's used.

import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  colors?: [string, string, ...string[]];
  big?: boolean;
  /** Extra bottom padding under the title row, e.g. when a card overlaps the header */
  extraBottom?: number;
};

function BackButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.88, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        style={styles.backBtn}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={wp(6)} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default function GradientHeader({
  title, subtitle, onBack, right, colors = ['#6C63FF', '#A78BFA'], big, extraBottom,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md + (extraBottom || 0) },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(380)} style={styles.row}>
        {onBack ? <BackButton onPress={onBack} /> : <View style={styles.spacer} />}

        <View style={styles.titleWrap}>
          <Text style={[styles.title, big && { fontSize: wp(6.2) }]} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {right ? <View style={styles.rightSlot}>{right}</View> : <View style={styles.spacer} />}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: wp(9.5), height: wp(9.5), borderRadius: wp(4.75),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  spacer: { width: wp(9.5) },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: wp(5), fontWeight: '800', color: '#fff', letterSpacing: 0.3, textAlign: 'center' },
  subtitle: { fontSize: wp(3.1), color: 'rgba(255,255,255,0.78)', marginTop: 2, textAlign: 'center' },
  rightSlot: { minWidth: wp(9.5), alignItems: 'flex-end' },
});
