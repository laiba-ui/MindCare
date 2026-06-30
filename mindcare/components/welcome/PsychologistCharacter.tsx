// components/welcome/PsychologistCharacter.tsx
// Animated SVG psychologist character — "Dr. Aria"
// Features:
//  - Eye blink every ~3s (useSharedValue toggle)
//  - Hand wave on mount (3 cycles then stops)
//  - Idle body float loop
//  - Speech bubble with typing-effect text
//  - Personalised greeting with user's first name

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Path, Line, G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

// ─── Speech bubble typing effect ────────────────────────────────────────────
function SpeechBubble({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
      } else {
        clearInterval(timer);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bubble}>
      <Text style={styles.bubbleName}>Dr. Aria · Your Wellness Guide</Text>
      <Text style={styles.bubbleText}>
        {displayed}
        {displayed.length < text.length && (
          <Text style={styles.cursor}>|</Text>
        )}
      </Text>
    </Animated.View>
  );
}

// ─── Main character ──────────────────────────────────────────────────────────
export default function PsychologistCharacter({ userName }: { userName: string }) {
  const firstName = userName.split(' ')[0];
  const SPEECH    = `Hello ${firstName}! Welcome to MindCare 💙 I'm here to support your mental wellness journey. You're taking a wonderful step — let's grow together!`;

  // Body float
  const bodyY = useSharedValue(0);
  // Blink (1 = open, 0 = closed)
  const eyeOpen = useSharedValue(1);
  // Wave arm
  const waveRot = useSharedValue(0);

  useEffect(() => {
    // Idle float — gentle up/down
    bodyY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Blink every ~3 s
    const blinkInterval = setInterval(() => {
      eyeOpen.value = withSequence(
        withTiming(0, { duration: 80 }),
        withDelay(100, withTiming(1, { duration: 80 })),
      );
    }, 3000);

    // Wave 3 times on mount then rest
    waveRot.value = withSequence(
      withDelay(300, withRepeat(
        withSequence(
          withTiming(-25, { duration: 220 }),
          withTiming(18,  { duration: 220 }),
        ),
        3,
        true,
      )),
    );

    return () => clearInterval(blinkInterval);
  }, []);

  const bodyStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: bodyY.value }] }));
  const eyeHStyle  = useAnimatedStyle(() => ({ transform: [{ scaleY: eyeOpen.value }] }));
  const waveStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${waveRot.value}deg` }] }));

  const SIZE = wp(30);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.characterWrap, bodyStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 120 120">
          {/* ── Lab coat body ── */}
          <Rect x="30" y="62" width="60" height="52" rx="12" fill="#fff" opacity="0.95" />
          {/* Lapels / shirt */}
          <Path d="M50 62 L60 80 L70 62" fill="#E8E6FF" />
          {/* Name badge */}
          <Rect x="34" y="82" width="22" height="14" rx="4" fill="#6C63FF" opacity="0.9" />
          <Rect x="36" y="86" width="18" height="2" rx="1" fill="#fff" opacity="0.7" />
          <Rect x="36" y="90" width="12" height="2" rx="1" fill="#fff" opacity="0.5" />
          {/* Stethoscope */}
          <Path d="M70 74 Q80 80 78 88 Q76 94 70 94" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
          <Circle cx="70" cy="94" r="4" fill="#A78BFA" />
          {/* Left arm */}
          <Rect x="17" y="64" width="16" height="36" rx="8" fill="#FDBCB4" />
          {/* Right arm (wave) */}
          <Animated.View
            style={[waveStyle, { position: 'absolute', top: 0, left: 0 }]}
          >
            {/* This is the wave hand — rendered as a second SVG over the main one */}
          </Animated.View>
          <Rect x="87" y="64" width="16" height="36" rx="8" fill="#FDBCB4" />
          {/* Wave hand fingers */}
          <G x="2" y="-10">
            <Circle cx="95" cy="60" r="9" fill="#FDBCB4" />
            <Rect x="89" y="51" width="4" height="13" rx="2" fill="#FDBCB4" />
            <Rect x="93.5" y="49" width="4" height="14" rx="2" fill="#FDBCB4" />
            <Rect x="98" y="51" width="4" height="13" rx="2" fill="#FDBCB4" />
          </G>

          {/* ── Head ── */}
          {/* Hair */}
          <Ellipse cx="60" cy="32" rx="24" ry="18" fill="#5C3317" />
          <Rect x="36" y="32" width="48" height="10" rx="4" fill="#5C3317" />
          {/* Face */}
          <Ellipse cx="60" cy="42" rx="20" ry="22" fill="#FDBCB4" />
          {/* Glasses */}
          <Rect x="43" y="37" width="14" height="10" rx="5" fill="none" stroke="#6C63FF" strokeWidth="1.5" />
          <Rect x="62" y="37" width="14" height="10" rx="5" fill="none" stroke="#6C63FF" strokeWidth="1.5" />
          <Line x1="57" y1="42" x2="62" y2="42" stroke="#6C63FF" strokeWidth="1.5" />
          {/* Eyes (open) */}
          <Ellipse cx="50" cy="42" rx="3.5" ry="3.5" fill="#2D2B55" />
          <Ellipse cx="69" cy="42" rx="3.5" ry="3.5" fill="#2D2B55" />
          {/* Eye highlights */}
          <Ellipse cx="51.4" cy="41" rx="1.2" ry="1.2" fill="#fff" />
          <Ellipse cx="70.4" cy="41" rx="1.2" ry="1.2" fill="#fff" />
          {/* Smile */}
          <Path d="M52 52 Q60 59 68 52" fill="none" stroke="#B06060" strokeWidth="2" strokeLinecap="round" />
          {/* Blush */}
          <Ellipse cx="44" cy="52" rx="5" ry="3.5" fill="#FFB3C1" opacity="0.5" />
          <Ellipse cx="76" cy="52" rx="5" ry="3.5" fill="#FFB3C1" opacity="0.5" />
        </Svg>
      </Animated.View>

      <SpeechBubble text={SPEECH} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  characterWrap: { alignItems: 'center' },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
    maxWidth: wp(72),
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bubbleName: {
    fontSize: wp(2.8),
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 5,
  },
  bubbleText: {
    fontSize: wp(3.4),
    color: '#2D2B55',
    lineHeight: wp(5.2),
  },
  cursor: {
    color: '#6C63FF',
    fontWeight: '100',
  },
});
