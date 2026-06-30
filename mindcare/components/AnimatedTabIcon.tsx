// components/AnimatedTabIcon.tsx
// Small wrapper that animates a soft "pill" highlight behind the active
// tab icon in the bottom navigation bar.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  activeBg?: string;
};

export function AnimatedTabIcon({ name, focused, color, activeBg = '#EEEAFF' }: Props) {
  const scale = useSharedValue(focused ? 1 : 0.001);
  const opacity = useSharedValue(focused ? 1 : 0);
  const lift = useSharedValue(focused ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.001, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 180 });
    lift.value = withSpring(focused ? -2 : 0, { damping: 14, stiffness: 180 });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pill, { backgroundColor: activeBg }, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons name={name} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 46, height: 30, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', width: 46, height: 30, borderRadius: 15 },
});
