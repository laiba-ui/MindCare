// components/ErrorBanner.tsx
// Reusable attractive error message banner with a shake + fade entrance.
// Drop-in replacement for plain Alert/Text error rows used across auth screens.

import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
  FadeInDown, FadeOutUp,
} from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

export default function ErrorBanner({ message }: { message?: string }) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (message) {
      shake.value = withSequence(
        withTiming(-8, { duration: 45 }),
        withTiming(8, { duration: 45 }),
        withTiming(-5, { duration: 45 }),
        withTiming(5, { duration: 45 }),
        withTiming(0, { duration: 45 }),
      );
    }
  }, [message]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(150)}
      style={[styles.row, animStyle]}
    >
      <Ionicons name="alert-circle" size={wp(4.4)} color="#E0303E" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF0F1',
    borderRadius: 14,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFD2D6',
  },
  text: {
    flex: 1,
    fontSize: wp(3.3),
    color: '#E0303E',
    fontWeight: '600',
    lineHeight: wp(4.6),
  },
});
