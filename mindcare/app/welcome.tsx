// app/welcome.tsx
// Premium Welcome Screen — Calm/Headspace-style
// Redesigned: semi-realistic SVG therapist illustration, no confetti,
// glassmorphism message card, premium button, gentle fade/slide animations.

import { useEffect, useState } from 'react';
import {
  Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle, ClipPath, Defs, Ellipse, G, LinearGradient as SvgGrad,
  Path, Rect, Stop,
} from 'react-native-svg';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';

// ── Premium semi-realistic therapist illustration ─────────────────────────────
// SVG drawn in a modern flat-3D style — professional, warm, minimal.
// Colour palette: ivory skin, deep violet clothes, soft warm accents.
function TherapistIllustration({ size = wp(72) }: { size?: number }) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
  }, []);

  const floatSt = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const W = size, H = size * 1.05;

  return (
    <Animated.View style={[{ alignItems: 'center' }, floatSt]}>
      <Svg width={W} height={H} viewBox="0 0 280 295">
        <Defs>
          {/* Skin gradient */}
          <SvgGrad id="skin" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#FDDCB5" />
            <Stop offset="1"   stopColor="#F4C090" />
          </SvgGrad>
          {/* Jacket gradient */}
          <SvgGrad id="jacket" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0"   stopColor="#4F3FBF" />
            <Stop offset="1"   stopColor="#6C63FF" />
          </SvgGrad>
          {/* Chair gradient */}
          <SvgGrad id="chair" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#7C72E8" />
            <Stop offset="1"   stopColor="#5B52D0" />
          </SvgGrad>
          {/* Shirt */}
          <SvgGrad id="shirt" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#FFFFFF" />
            <Stop offset="1"   stopColor="#E8E6FF" />
          </SvgGrad>
          {/* Hair */}
          <SvgGrad id="hair" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#2D1B00" />
            <Stop offset="1"   stopColor="#4A3000" />
          </SvgGrad>
          {/* Shadow */}
          <SvgGrad id="shadow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="rgba(108,99,255,0.18)" />
            <Stop offset="1"   stopColor="rgba(108,99,255,0)" />
          </SvgGrad>
          {/* Notepad */}
          <SvgGrad id="pad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#FFFBF0" />
            <Stop offset="1"   stopColor="#FFF3D0" />
          </SvgGrad>
        </Defs>

        {/* ── Ground shadow ── */}
        <Ellipse cx="140" cy="288" rx="80" ry="8" fill="url(#shadow)" />

        {/* ── Chair back ── */}
        <Rect x="62" y="148" width="156" height="110" rx="22" fill="url(#chair)" />
        <Rect x="72" y="155" width="136" height="96"  rx="16" fill="rgba(255,255,255,0.10)" />

        {/* ── Body / Jacket ── */}
        <Path d="M88 200 Q88 168 140 162 Q192 168 192 200 L198 285 H82 Z"
          fill="url(#jacket)" />
        {/* Jacket lapels */}
        <Path d="M140 162 L120 185 L140 195 L160 185 Z" fill="url(#shirt)" />
        {/* Jacket centre line */}
        <Path d="M140 195 L140 280" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        {/* Jacket buttons */}
        <Circle cx="140" cy="218" r="3.5" fill="rgba(255,255,255,0.55)" />
        <Circle cx="140" cy="234" r="3.5" fill="rgba(255,255,255,0.55)" />
        <Circle cx="140" cy="250" r="3.5" fill="rgba(255,255,255,0.55)" />

        {/* ── Shirt collar ── */}
        <Path d="M122 180 Q130 190 140 188 Q150 190 158 180"
          fill="none" stroke="rgba(108,99,255,0.3)" strokeWidth="1" />

        {/* ── Left arm (resting on notepad) ── */}
        <Path d="M88 200 Q72 210 68 235 Q66 252 80 258 L100 258 Q108 240 108 220 Z"
          fill="url(#jacket)" />
        {/* Left hand */}
        <Ellipse cx="80" cy="262" rx="14" ry="9" fill="url(#skin)" />
        <Path d="M68 260 Q72 252 80 258" fill="url(#skin)" />

        {/* ── Right arm (slightly raised) ── */}
        <Path d="M192 200 Q208 208 212 228 Q216 248 202 256 L185 252 Q180 234 184 214 Z"
          fill="url(#jacket)" />
        {/* Right hand (holding pen) */}
        <Ellipse cx="202" cy="258" rx="13" ry="9" fill="url(#skin)" />
        {/* Pen */}
        <Rect x="208" y="242" width="4" height="28" rx="2"
          fill="#6C63FF" transform="rotate(-18 208 242)" />
        <Path d="M214 268 L216 275 L210 270 Z"
          fill="#FFD060" transform="rotate(-18 213 271)" />

        {/* ── Notepad ── */}
        <Rect x="90" y="252" width="88" height="60" rx="6" fill="url(#pad)" />
        <Rect x="90" y="252" width="88" height="10" rx="6" fill="#FFD060" opacity="0.7" />
        {/* Note lines */}
        <Path d="M98 272 H170" stroke="#DDD8C0" strokeWidth="1.5" />
        <Path d="M98 280 H162" stroke="#DDD8C0" strokeWidth="1.5" />
        <Path d="M98 288 H155" stroke="#DDD8C0" strokeWidth="1.5" />
        {/* Notepad binding rings */}
        {[0,1,2,3,4].map(i => (
          <Circle key={i} cx={104 + i*16} cy={252} r="3.5"
            fill="none" stroke="#C8C0A0" strokeWidth="1.5" />
        ))}

        {/* ── Neck ── */}
        <Rect x="128" y="138" width="24" height="28" rx="10" fill="url(#skin)" />

        {/* ── Head ── */}
        <Ellipse cx="140" cy="112" rx="42" ry="46" fill="url(#skin)" />

        {/* ── Hair ── */}
        <Path d="M100 108 Q98 72 140 66 Q182 72 180 108 Q165 88 140 88 Q115 88 100 108 Z"
          fill="url(#hair)" />
        {/* Hair side strands */}
        <Path d="M100 108 Q94 118 98 130" fill="none" stroke="#2D1B00" strokeWidth="6" strokeLinecap="round" />
        <Path d="M180 108 Q186 118 182 130" fill="none" stroke="#2D1B00" strokeWidth="6" strokeLinecap="round" />

        {/* ── Ears ── */}
        <Ellipse cx="98"  cy="116" rx="8"  ry="10" fill="#F4C090" />
        <Ellipse cx="182" cy="116" rx="8"  ry="10" fill="#F4C090" />
        <Ellipse cx="98"  cy="116" rx="4.5" ry="6" fill="#EDAA78" />
        <Ellipse cx="182" cy="116" rx="4.5" ry="6" fill="#EDAA78" />

        {/* ── Eyebrows ── */}
        <Path d="M118 96 Q126 91 134 94" fill="none" stroke="#2D1B00" strokeWidth="2.8" strokeLinecap="round" />
        <Path d="M146 94 Q154 91 162 96" fill="none" stroke="#2D1B00" strokeWidth="2.8" strokeLinecap="round" />

        {/* ── Eyes ── */}
        {/* Eye whites */}
        <Ellipse cx="126" cy="108" rx="10" ry="9"  fill="#fff" />
        <Ellipse cx="154" cy="108" rx="10" ry="9"  fill="#fff" />
        {/* Irises */}
        <Circle cx="127" cy="109" r="6.5" fill="#3D2B8A" />
        <Circle cx="155" cy="109" r="6.5" fill="#3D2B8A" />
        {/* Pupils */}
        <Circle cx="128" cy="109.5" r="3.5" fill="#1A0F40" />
        <Circle cx="156" cy="109.5" r="3.5" fill="#1A0F40" />
        {/* Eye highlights */}
        <Circle cx="130" cy="107" r="1.8" fill="#fff" />
        <Circle cx="158" cy="107" r="1.8" fill="#fff" />
        {/* Lower lash line */}
        <Path d="M116 114 Q126 117 136 114" fill="none" stroke="#C8956A" strokeWidth="1" />
        <Path d="M144 114 Q154 117 164 114" fill="none" stroke="#C8956A" strokeWidth="1" />

        {/* ── Glasses ── */}
        <Rect x="112" y="100" width="28" height="18" rx="8"
          fill="none" stroke="rgba(108,99,255,0.8)" strokeWidth="2.2" />
        <Rect x="143" y="100" width="28" height="18" rx="8"
          fill="none" stroke="rgba(108,99,255,0.8)" strokeWidth="2.2" />
        <Path d="M140 109 L143 109" stroke="rgba(108,99,255,0.8)" strokeWidth="2" />
        <Path d="M112 109 Q106 109 102 112" stroke="rgba(108,99,255,0.8)" strokeWidth="2" strokeLinecap="round" />
        <Path d="M171 109 Q177 109 181 112" stroke="rgba(108,99,255,0.8)" strokeWidth="2" strokeLinecap="round" />

        {/* ── Nose ── */}
        <Path d="M138 116 Q136 124 138 128 Q140 130 142 128 Q144 124 142 116"
          fill="none" stroke="#D4956A" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── Smile ── */}
        <Path d="M126 138 Q133 145 140 145 Q147 145 154 138"
          fill="none" stroke="#C07050" strokeWidth="2.5" strokeLinecap="round" />
        {/* Cheek blush */}
        <Ellipse cx="116" cy="132" rx="10" ry="6" fill="rgba(255,160,120,0.22)" />
        <Ellipse cx="164" cy="132" rx="10" ry="6" fill="rgba(255,160,120,0.22)" />

        {/* ── Name badge ── */}
        <Rect x="108" y="204" width="64" height="22" rx="6" fill="rgba(255,255,255,0.18)" />
        <Path d="M113 212 H172" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        <Path d="M118 218 H165" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

        {/* ── Stethoscope ── */}
        <Path d="M152 172 Q168 178 170 192 Q172 204 164 208"
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="163" cy="210" r="5" fill="rgba(255,255,255,0.45)" />
      </Svg>
    </Animated.View>
  );
}

// ── Typing text hook ──────────────────────────────────────────────────────────
function useTypingText(text: string, delay: number = 800) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, ++i));
        } else {
          setDone(true);
          clearInterval(t);
        }
      }, 26);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(start);
  }, [text]);

  return { displayed, done };
}

// ── Premium message card ──────────────────────────────────────────────────────
function MessageCard({ firstName }: { firstName: string }) {
 const msg  = `Hello ${firstName}! Welcome to MindCare 💙 I'm Maia, your personal AI wellness companion. I'm here to support your mental health journey — let's grow together! 🌱`;
  const { displayed, done } = useTypingText(msg, 900);
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  return (
    <Animated.View entering={FadeInUp.delay(600).duration(500).easing(Easing.out(Easing.ease))} style={cardS.outer}>
      {/* Glassmorphism card */}
      <View style={cardS.card}>
        {/* AI avatar */}
        <View style={cardS.avatarCol}>
          <LinearGradient colors={['#8B7FFF','#6C63FF']} style={cardS.avatar}>
            <Text style={cardS.avatarEmoji}>👩‍⚕️</Text>
          </LinearGradient>
          <View style={cardS.onlineDot} />
        </View>
        {/* Message content */}
        <View style={cardS.msgCol}>
          <Text style={cardS.senderName}>Maia</Text>
<Text style={cardS.senderRole}>Your AI Wellness Companion</Text>
          <Text style={cardS.msgText}>
            {displayed}
            {!done && <Text style={cardS.cursor}> ▌</Text>}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const cardS = StyleSheet.create({
  outer: { width: '100%', paddingHorizontal: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } as any
      : { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 }),
  },
  avatarCol: { alignItems: 'center', gap: 5 },
  avatar: {
    width: wp(11), height: wp(11), borderRadius: wp(5.5),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarEmoji: { fontSize: wp(6.5) },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  msgCol:     { flex: 1 },
  senderName: { fontSize: wp(3.5), fontWeight: '800', color: '#fff', marginBottom: 1 },
  senderRole: { fontSize: wp(2.8), color: 'rgba(255,255,255,0.65)', marginBottom: 7, fontWeight: '500' },
  msgText:    { fontSize: wp(3.5), color: 'rgba(255,255,255,0.92)', lineHeight: wp(5.4), fontWeight: '400' },
  cursor:     { color: 'rgba(255,255,255,0.7)', fontWeight: '100' },
});

// ── Premium CTA button ────────────────────────────────────────────────────────
function BeginButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const glow  = useSharedValue(0.7);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1400 }), withTiming(0.7, { duration: 1400 })),
      -1, true,
    );
  }, []);

  const btnStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 90 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 8 }); }}
      onPress={onPress}
    >
      <Animated.View style={btnStyle}>
        {/* Glow ring behind button */}
        <Animated.View style={[btnS.glowRing, glowStyle]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(240,238,255,0.96)']}
          style={btnS.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={btnS.text}>Let's Begin</Text>
          <View style={btnS.arrow}>
            <Text style={btnS.arrowText}>→</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const btnS = StyleSheet.create({
  glowRing: {
    position: 'absolute',
    top: -8, left: -8, right: -8, bottom: -8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: wp(3.8), paddingHorizontal: wp(10),
    borderRadius: 999,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 28px rgba(0,0,0,0.18)' } as any
      : { shadowColor: '#4A3FBF', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }),
  },
  text: { fontSize: wp(4.5), fontWeight: '800', color: '#4A3FBF', letterSpacing: 0.3 },
  arrow: {
    width: wp(7), height: wp(7), borderRadius: wp(3.5),
    backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: wp(4), color: '#fff', fontWeight: '800', marginTop: -1 },
});

// ── Welcome Screen ────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name: string }>();
  const firstName = (name || 'Friend').split(' ')[0];

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)' as any), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient
      colors={['#3D2096', '#6C63FF', '#9B8FFF']}
      style={[S.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]}
      start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
    >
      {/* Subtle ambient orbs — calm, not confetti */}
      <View style={S.orb1} />
      <View style={S.orb2} />
      <View style={S.orb3} />

      {/* ── Top notification toast ── */}
      <Animated.View entering={FadeInDown.duration(500)} style={S.toastRow}>
        <View style={S.toast}>
          <View style={S.toastDot} />
          <Text style={S.toastText}>Welcome to MindCare ✦</Text>
        </View>
      </Animated.View>

      {/* ── Heading ── */}
      <Animated.View
        entering={FadeInDown.delay(180).duration(550).easing(Easing.out(Easing.ease))}
        style={S.headingWrap}
      >
        <Text style={S.title}>Welcome, {firstName}!</Text>
        <Text style={S.subtitle}>Your mental wellness journey starts here.</Text>
      </Animated.View>

      {/* ── Illustration ── */}
      <Animated.View
        entering={FadeIn.delay(280).duration(700).easing(Easing.out(Easing.ease))}
        style={S.illustrationWrap}
      >
        <TherapistIllustration size={wp(68)} />
      </Animated.View>

      {/* ── Message card ── */}
      <MessageCard firstName={firstName} />

      {/* ── CTA button ── */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(500).easing(Easing.out(Easing.ease))}
        style={S.ctaWrap}
      >
        <BeginButton onPress={() => router.replace('/(tabs)' as any)} />
        <Text style={S.hint}>Continuing automatically in a moment…</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(6),
    overflow: 'hidden',
  },

  // Ambient orbs — soft, static, not confetti
  orb1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(167,139,250,0.12)', top: -60, right: -80,
  },
  orb2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: hp(18), left: -60,
  },
  orb3: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(108,99,255,0.15)', bottom: -30, right: -20,
  },

  // Toast
  toastRow: { width: '100%', alignItems: 'center', marginTop: spacing.xs },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.lg, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  toastDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#34D399' },
  toastText: { fontSize: wp(3.3), color: '#fff', fontWeight: '700', letterSpacing: 0.3 },

  // Heading
  headingWrap: { alignItems: 'center', marginTop: spacing.sm },
  title: {
    fontSize: wp(7.5), fontWeight: '900', color: '#fff',
    textAlign: 'center', letterSpacing: 0.2,
    ...(Platform.OS === 'web'
      ? { textShadow: '0 2px 16px rgba(0,0,0,0.18)' } as any
      : { textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }),
  },
  subtitle: {
    fontSize: wp(3.8), color: 'rgba(255,255,255,0.78)',
    textAlign: 'center', marginTop: 6, lineHeight: wp(5.8), fontWeight: '400',
  },

  // Illustration
  illustrationWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: spacing.xs },

  // CTA
  ctaWrap:  { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xs },
  hint: {
    fontSize: wp(3.1), color: 'rgba(255,255,255,0.55)',
    fontWeight: '500', letterSpacing: 0.2,
  },
});
