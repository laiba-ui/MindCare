// app/(tabs)/breathing.tsx
// 4-7-8 Breathing Exercise — FIXED layout
//
// Fix applied:
//  - Replaced flex:1 LinearGradient container with ScrollView wrapper
//    so content is never clipped on small screens or when tab bar is tall
//  - Circle size reduced slightly on small phones (hp-based cap)
//  - Controls and tip are always visible without needing to scroll on most devices,
//    but scroll is available as a safety net

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  cancelAnimation, Easing, runOnJS,
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

// ── Phase config ──────────────────────────────────────────────────────────────
const PHASES = [
  { name: 'Inhale',  dur: 4, color: '#6C63FF', label: 'Breathe in through your nose…' },
  { name: 'Hold',    dur: 7, color: '#A78BFA', label: 'Hold gently…' },
  { name: 'Exhale',  dur: 8, color: '#34C77B', label: 'Exhale fully through your mouth…' },
] as const;

// ── Responsive circle — smaller on compact screens ────────────────────────────
const CIRCLE_SIZE = Math.min(wp(52), hp(28));   // never taller than 28% of screen height
const INNER_SIZE  = CIRCLE_SIZE * 0.72;
const MAX_SCALE   = 1.22;
const RING_MAX_SCALE = 1.38;

// ── Breathing engine ──────────────────────────────────────────────────────────
function useBreathingEngine(running: boolean) {
  const phaseRef    = useRef(0);
  const countRef    = useRef(PHASES[0].dur);
  const cyclesRef   = useRef(0);
  const secondsRef  = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scale     = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOp    = useSharedValue(0);
  const countNum  = useSharedValue(PHASES[0].dur);
  const phaseIdx  = useSharedValue(0);

  const applyPhaseAnimation = (idx: number) => {
    const p = PHASES[idx];
    if (idx === 0) {
      scale.value     = withTiming(MAX_SCALE, { duration: p.dur * 900, easing: Easing.out(Easing.ease) });
      ringOp.value    = withTiming(0, { duration: 400 });
      ringScale.value = withTiming(1, { duration: 400 });
    } else if (idx === 1) {
      scale.value     = withTiming(MAX_SCALE, { duration: 200 });
      ringOp.value    = withTiming(0.55, { duration: 400 });
      ringScale.value = withRepeat(
        withSequence(
          withTiming(RING_MAX_SCALE, { duration: 900 }),
          withTiming(1.1, { duration: 900 }),
        ), -1, true,
      );
    } else {
      scale.value     = withTiming(1, { duration: p.dur * 900, easing: Easing.in(Easing.ease) });
      ringOp.value    = withTiming(0, { duration: 600 });
      ringScale.value = withTiming(1, { duration: 400 });
    }
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimation(scale); cancelAnimation(ringScale); cancelAnimation(ringOp);
  };

  const start = () => {
    phaseRef.current  = 0;
    countRef.current  = PHASES[0].dur;
    phaseIdx.value    = 0;
    countNum.value    = PHASES[0].dur;
    applyPhaseAnimation(0);

    intervalRef.current = setInterval(() => {
      secondsRef.current++;
      countRef.current--;
      countNum.value = countRef.current;

      if (countRef.current <= 0) {
        phaseRef.current = (phaseRef.current + 1) % 3;
        if (phaseRef.current === 0) cyclesRef.current++;
        countRef.current = PHASES[phaseRef.current].dur;
        countNum.value   = countRef.current;
        phaseIdx.value   = phaseRef.current;
        applyPhaseAnimation(phaseRef.current);
        runOnJS(AccessibilityInfo.announceForAccessibility)(PHASES[phaseRef.current].name);
      }
    }, 1000);
  };

  useEffect(() => {
    running ? start() : stop();
    return stop;
  }, [running]);

  return { scale, ringScale, ringOp, countNum, phaseIdx, cyclesRef, secondsRef };
}

// ── Stat badge ────────────────────────────────────────────────────────────────
function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState('0:00');
  const [cycles,  setCycles]  = useState(0);
  const [pIdx,    setPIdx]    = useState(0);

  const { scale, ringScale, ringOp, countNum, phaseIdx, cyclesRef, secondsRef } =
    useBreathingEngine(running);

  // Poll stats every 500ms while running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const s = secondsRef.current;
      setElapsed(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      setCycles(cyclesRef.current);
      setPIdx(phaseIdx.value);
    }, 500);
    return () => clearInterval(t);
  }, [running]);

  // Pause on tab blur
  useFocusEffect(useCallback(() => () => setRunning(false), []));

  const reset = () => {
    setRunning(false);
    setElapsed('0:00');
    setCycles(0);
    setPIdx(0);
    secondsRef.current = 0;
    cyclesRef.current  = 0;
  };

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle   = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }], opacity: ringOp.value }));

  const phase = PHASES[pIdx];

  return (
    // ── KEY FIX: ScrollView wrapping the LinearGradient so nothing is clipped ──
    <ScrollView
      style={styles.scrollOuter}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <LinearGradient colors={['#1A1A2E', '#2D2B55', '#1A1A2E']} style={styles.gradient}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Breathing Exercise</Text>
          <Text style={styles.headerSub}>4-7-8 Technique</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBadge label="Cycles" value={cycles} />
          <StatBadge label="Time"   value={elapsed} />
          <StatBadge label="Phase"  value={running ? phase.name : '—'} />
        </View>

        {/* Phase text */}
        <Text style={styles.phaseLabel}>
          {running ? phase.label : 'Press Start to begin'}
        </Text>

        {/* Animated circle */}
        <View style={styles.circleArea}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.circle, circleStyle, { borderColor: phase.color }]}>
            <View style={styles.innerCircle}>
              <Animated.Text style={[styles.countNum, { color: phase.color }]}>
                {running ? String(Math.ceil(countNum.value)) : '—'}
              </Animated.Text>
              <Text style={styles.phaseName}>{running ? phase.name : 'Ready'}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Phase guide dots */}
        <View style={styles.phaseGuide}>
          {PHASES.map((p, i) => (
            <View key={p.name} style={styles.phaseGuideItem}>
              <View style={[styles.phaseGuideDot, { backgroundColor: i === pIdx && running ? p.color : 'rgba(255,255,255,0.2)' }]} />
              <Text style={[styles.phaseGuideLabel, i === pIdx && running && styles.phaseGuideLabelActive]}>
                {p.name} ({p.dur}s)
              </Text>
            </View>
          ))}
        </View>

        {/* ── Controls — always visible, no scroll needed ── */}
        <View style={styles.controls}>
          <Pressable style={[styles.controlBtn, styles.resetBtn]} onPress={reset}
            accessibilityLabel="Reset breathing exercise">
            <Ionicons name="refresh-outline" size={wp(5)} color="rgba(255,255,255,0.75)" />
            <Text style={styles.resetBtnText}>Reset</Text>
          </Pressable>

          <Pressable
            style={[styles.controlBtn, styles.playBtn, { backgroundColor: running ? '#4B4880' : '#6C63FF' }]}
            onPress={() => setRunning(r => !r)}
            accessibilityLabel={running ? 'Pause' : 'Start'}
            accessibilityRole="button"
          >
            <Ionicons name={running ? 'pause' : 'play'} size={wp(6)} color="#fff" />
            <Text style={styles.playBtnText}>{running ? 'Pause' : 'Start'}</Text>
          </Pressable>
        </View>

        {/* Tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Inhale 4 s · Hold 7 s · Exhale 8 s — repeat 4 cycles for deep calm
          </Text>
        </View>

      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ── Scroll wrapper fills entire screen behind tab bar ──
  scrollOuter:   { flex: 1, backgroundColor: '#1A1A2E' },
  scrollContent: { flexGrow: 1 },
  gradient:      { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, minHeight: hp(80) },

  header:      { alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: wp(5.5), fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub:   { fontSize: wp(3.5), color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  statsRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statBadge: {
    alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 14, borderWidth: 1, minWidth: wp(22),
    backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.15)',
  },
  statVal: { fontSize: wp(5), fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: wp(2.8), color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  phaseLabel: {
    fontSize: wp(3.6), color: 'rgba(255,255,255,0.65)', textAlign: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md, lineHeight: wp(5.5),
  },

  circleArea: {
    width: CIRCLE_SIZE * 1.45, height: CIRCLE_SIZE * 1.45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ring: {
    position: 'absolute',
    width: CIRCLE_SIZE, height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2, borderColor: '#A78BFA',
  },
  circle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(108,99,255,0.18)',
    borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: {
    width: INNER_SIZE, height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: 'rgba(108,99,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  countNum:  { fontSize: wp(9), fontWeight: '900' },
  phaseName: { fontSize: wp(3.2), color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: 2 },

  phaseGuide:            { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  phaseGuideItem:        { alignItems: 'center', gap: 5 },
  phaseGuideDot:         { width: 8, height: 8, borderRadius: 4 },
  phaseGuideLabel:       { fontSize: wp(2.8), color: 'rgba(255,255,255,0.40)', fontWeight: '600' },
  phaseGuideLabelActive: { color: '#fff', fontWeight: '700' },

  controls:    { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  controlBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg,
    borderRadius: 999,
  },
  resetBtn:     { backgroundColor: 'rgba(255,255,255,0.10)' },
  resetBtnText: { fontSize: wp(3.8), color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  playBtn: {
    paddingHorizontal: spacing.xl,
    shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  playBtnText: { fontSize: wp(4), color: '#fff', fontWeight: '800' },

  tipBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    marginHorizontal: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  tipText: {
    fontSize: wp(3.2), color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: wp(4.8),
  },
});
