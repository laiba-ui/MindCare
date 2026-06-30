// components/ui/SegmentedControl.tsx
// Reusable animated pill toggle — the active segment slides with a spring.
// Replaces the several near-identical hand-rolled toggle rows scattered
// across MoodTracker, Progress, etc.

import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';

export type Segment = { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap };

type Props = {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
  activeColor?: string;
};

export default function SegmentedControl({ segments, value, onChange, activeColor = '#6C63FF' }: Props) {
  const [width, setWidth] = useState(0);
  const tx = useSharedValue(0);
  const segWidth = width / segments.length;

  useEffect(() => {
    const idx = Math.max(0, segments.findIndex(s => s.key === value));
    tx.value = withSpring(idx * segWidth, { damping: 16, stiffness: 170 });
  }, [value, segWidth]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    width: segWidth || 0,
  }));

  return (
    <View style={styles.track} onLayout={onLayout}>
      {width > 0 && (
        <Animated.View style={[styles.pill, pillStyle, { backgroundColor: activeColor }]} />
      )}
      {segments.map(s => {
        const active = s.key === value;
        return (
          <Pressable key={s.key} style={styles.seg} onPress={() => onChange(s.key)}>
            {s.icon && <Ionicons name={s.icon} size={wp(4)} color={active ? '#fff' : activeColor} />}
            <Text style={[styles.label, { color: active ? '#fff' : activeColor }]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row', backgroundColor: '#EDE9FF', borderRadius: 20,
    padding: 4, position: 'relative', overflow: 'hidden',
  },
  pill: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 18 },
  seg: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, zIndex: 1,
  },
  label: { fontSize: wp(3.4), fontWeight: '700' },
});
