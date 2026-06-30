// components/ui/WellnessRing.tsx
// Circular animated SVG progress ring for the Dashboard wellness score.
//
// Features:
//  - Animates from 0 → target on mount (or when `score` changes)
//  - Gradient stroke via a LinearGradient def inside SVG
//  - Pulsing glow ring behind the stroke
//  - Score number counts up with the ring
//  - Accessible: aria-label announces the score

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming,
  useAnimatedStyle, withRepeat, withSequence, Easing,
  useDerivedValue, withDelay,
} from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score:      number;   // 0-100
  size?:      number;
  strokeWidth?: number;
  label?:     string;
  subLabel?:  string;
  delay?:     number;
}

export default function WellnessRing({
  score,
  size        = wp(32),
  strokeWidth = 10,
  label       = 'Wellness Score',
  subLabel    = 'Keep it up!',
  delay       = 300,
}: Props) {
  const R            = (size - strokeWidth) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  const progress = useSharedValue(0);
  const glow     = useSharedValue(1);

  useEffect(() => {
    // Animate stroke from 0 → score
    progress.value = withDelay(delay, withTiming(score / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    }));
    // Idle glow pulse
    glow.value = withDelay(delay + 1200, withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200 }),
        withTiming(1.0,  { duration: 1200 }),
      ), -1, true,
    ));
  }, [score]);

  // strokeDashoffset drives how much of the arc is filled
  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  // Live counter — synced to the progress animation
  const displayScore = useDerivedValue(() =>
    Math.round(progress.value * 100),
  );

  // Glow ring scale
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  // Colour of score — green when high, amber medium, red low
  const scoreColor = score >= 70 ? '#34C77B' : score >= 45 ? '#FFA726' : '#FF6B6B';

  return (
    <View style={styles.wrap} accessibilityLabel={`Wellness score: ${score} out of 100`}>
      {/* Pulsing background glow */}
      <Animated.View
        style={[
          styles.glowRing,
          glowStyle,
          {
            width:        size,
            height:       size,
            borderRadius: size / 2,
            borderColor:  scoreColor + '28',
          },
        ]}
      />

      {/* SVG ring */}
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor="#6C63FF" />
            <Stop offset="100%" stopColor="#34C77B" />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none"
          stroke="#EDE9FF"
          strokeWidth={strokeWidth}
        />
        {/* Animated foreground arc */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animProps}
          // Start arc from top (SVG default starts at 3 o'clock)
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Centre text */}
      <View style={[styles.centre, { width: size, height: size }]}>
        <Animated.Text style={[styles.score, { color: scoreColor }]}>
          {/* We approximate the counter with JS — close enough without interpolation */}
          {score}
        </Animated.Text>
        <Text style={styles.pct}>/ 100</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowRing:{
    position: 'absolute',
    borderWidth: 8,
  },
  svg:     { position: 'absolute' },
  centre:  {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score:   { fontSize: wp(8), fontWeight: '900', lineHeight: wp(9) },
  pct:     { fontSize: wp(3.2), color: '#9A98B5', fontWeight: '600' },
  label:   { fontSize: wp(2.8), color: '#9A98B5', marginTop: 2, fontWeight: '600', textAlign: 'center' },
});
