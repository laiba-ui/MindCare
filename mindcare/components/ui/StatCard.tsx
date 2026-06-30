// components/ui/StatCard.tsx
// "Analytics SaaS" style stat widget — icon chip, big animated number, label.
// Used in dashboard / progress / profile for streaks, counts, averages, etc.

import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing, radii, shadow } from '@/constants/theme';
import AnimatedCounter from './AnimatedCounter';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  delay?: number;
};

export default function StatCard({
  icon, iconColor = '#6C63FF', value, decimals = 0, suffix = '', prefix = '', label, delay = 0,
}: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420)} style={styles.card}>
      <View style={[styles.iconChip, { backgroundColor: iconColor + '1A' }]}>
        <Ionicons name={icon} size={wp(4.6)} color={iconColor} />
      </View>
      <AnimatedCounter
        value={value}
        decimals={decimals}
        suffix={suffix}
        prefix={prefix}
        style={styles.value}
      />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
    ...shadow.soft,
  },
  iconChip: {
    width: wp(8.5), height: wp(8.5), borderRadius: wp(2.6),
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  value: { fontSize: wp(5.6), fontWeight: '800', color: '#2D2B55', letterSpacing: 0.2 },
  label: { fontSize: wp(2.9), color: '#8B89AC', fontWeight: '600', marginTop: 2 },
});
