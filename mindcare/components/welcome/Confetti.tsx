// components/welcome/Confetti.tsx
// Lightweight confetti animation using react-native-reanimated.
// Spawns N coloured squares / circles that fly up from the bottom
// with randomised x-drift, rotation, and opacity fade.
// No external libraries — pure Reanimated.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { wp, hp } from '@/app/utils/responsive';

const COLORS = [
  '#6C63FF', '#A78BFA', '#E91E8C', '#FFB347',
  '#34C77B', '#FF6B9D', '#4FC3F7', '#FDD835',
];

type Piece = {
  id:       number;
  x:        number;   // 0-100 percent across the screen
  delay:    number;
  color:    string;
  size:     number;
  circle:   boolean;
  duration: number;
  drift:    number;   // horizontal drift in px
  startY:   number;   // start Y offset from bottom
  rot:      number;   // end rotation degrees
};

function makePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id:       i,
    x:        Math.random() * 100,
    delay:    Math.random() * 800,
    color:    COLORS[Math.floor(Math.random() * COLORS.length)],
    size:     6 + Math.random() * 7,
    circle:   Math.random() > 0.5,
    duration: 1800 + Math.random() * 1400,
    drift:    (Math.random() - 0.5) * 80,
    startY:   0,
    rot:      (Math.random() - 0.5) * 540,
  }));
}

function ConfettiPiece({ piece, screenH }: { piece: Piece; screenH: number }) {
  const translateY  = useSharedValue(0);
  const translateX  = useSharedValue(0);
  const rotate      = useSharedValue(0);
  const opacity     = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: piece.duration, easing: Easing.out(Easing.quad) };
    translateY.value = withDelay(piece.delay, withTiming(-screenH * 0.9, cfg));
    translateX.value = withDelay(piece.delay, withTiming(piece.drift, cfg));
    rotate.value     = withDelay(piece.delay, withTiming(piece.rot, cfg));
    opacity.value    = withDelay(piece.delay, withTiming(1, { duration: 100 }));
    // Fade out at end
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
    }, piece.delay + piece.duration - 400);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        style,
        {
          left:          `${piece.x}%` as any,
          bottom:        0,
          width:         piece.size,
          height:        piece.size,
          backgroundColor: piece.color,
          borderRadius:  piece.circle ? piece.size : 2,
        },
      ]}
    />
  );
}

type Props = {
  count?:   number;
  active?:  boolean;
};

export default function Confetti({ count = 36, active = true }: Props) {
  const pieces = makePieces(count);
  const screenH = hp(100);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => (
        <ConfettiPiece key={p.id} piece={p} screenH={screenH} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});
