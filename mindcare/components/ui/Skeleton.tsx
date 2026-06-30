// components/ui/Skeleton.tsx
// Animated shimmer placeholder used while data is loading — replaces blank
// spinners with content-shaped "ghost" blocks for a more premium feel.

import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { radii } from '@/constants/theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: any;
};

export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: Props) {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#E6E4F7' }, animStyle, style]} />
  );
}

/** Pre-built skeleton matching the dashboard's chart card while data loads. */
export function SkeletonChartCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={140} height={18} />
        <Skeleton width={70} height={22} radius={radii.pill} />
      </View>
      <Skeleton width="100%" height={10} style={{ marginTop: 18 }} />
      <View style={[styles.row, { marginTop: 10 }]}>
        {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} width={18} height={60 + (i % 3) * 20} radius={6} />)}
      </View>
    </View>
  );
}

/** Pre-built skeleton matching a 3-up stat row while data loads. */
export function SkeletonStatRow() {
  return (
    <View style={[styles.row, { gap: 10, marginBottom: 14 }]}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.statCard}>
          <Skeleton width={34} height={34} radius={10} />
          <Skeleton width={40} height={20} style={{ marginTop: 10 }} />
          <Skeleton width={60} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16 },
  row:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 14, alignItems: 'flex-start' },
});
