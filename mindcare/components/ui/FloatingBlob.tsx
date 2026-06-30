// components/ui/FloatingBlob.tsx
// Subtle, lightweight floating "blob" decoration used behind glass cards on
// premium screens (login/signup). Loops a slow translateY + opacity breathe —
// cheap to run (single shared value per blob, no JS-thread work after mount).

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';

type Props = {
  size: number;
  color: string;
  top?: number; left?: number; right?: number; bottom?: number;
  delay?: number;
  duration?: number;
};

export default function FloatingBlob({ size, color, top, left, right, bottom, delay = 0, duration = 4200 }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -14 * t.value + 7 * (1 - t.value) },
      { scale: 1 + 0.06 * t.value },
    ],
    opacity: 0.55 + 0.25 * t.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: size, height: size, borderRadius: size / 2, backgroundColor: color,
          top, left, right, bottom,
        },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
});
