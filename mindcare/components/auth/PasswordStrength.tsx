// components/auth/PasswordStrength.tsx
// Live password strength meter + dynamic requirement checklist.
// Pure UI feedback component — does NOT enforce/validate submission rules,
// those remain exactly as defined in the screen that uses this component.

import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeOutUp, interpolateColor,
  useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

export type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): { level: StrengthLevel; score: number } {
  if (!password) return { level: 'empty', score: 0 };
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { level: 'weak', score };
  if (score <= 4) return { level: 'medium', score };
  return { level: 'strong', score };
}

const STRENGTH_META: Record<StrengthLevel, { color: string; label: string }> = {
  empty:  { color: '#E0DEFF', label: '' },
  weak:   { color: '#FF4D5A', label: 'Weak password' },
  medium: { color: '#FFA726', label: 'Medium password' },
  strong: { color: '#2ECC71', label: 'Strong password' },
};

function RequirementRow({ label, met }: { label: string; met: boolean }) {
  const pop = useSharedValue(1);

  useEffect(() => {
    pop.value = withSequence(
      withTiming(1.25, { duration: 110 }),
      withTiming(1, { duration: 140 }),
    );
  }, [met]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.reqRow}>
      <Animated.View style={animStyle}>
        <Ionicons
          name={met ? 'checkmark-circle' : 'ellipse-outline'}
          size={wp(3.8)}
          color={met ? '#2ECC71' : '#C7C5DE'}
        />
      </Animated.View>
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );
}

export default function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const { level, score } = useMemo(() => getPasswordStrength(password), [password]);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(score, { duration: 300 });
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${(progress.value / 5) * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 2, 3, 4, 5],
      ['#E0DEFF', '#FF4D5A', '#FFA726', '#FFA726', '#2ECC71'],
    ),
  }));

  if (!password) return null;

  const meta = STRENGTH_META[level];
  const REQS: { key: keyof PasswordChecks; label: string }[] = [
    { key: 'length',    label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
    { key: 'lowercase', label: 'One lowercase letter (a-z)' },
    { key: 'number',    label: 'One number (0-9)' },
    { key: 'special',   label: 'One special character (!@#$...)' },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(150)} style={styles.wrap}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <Text style={[styles.strengthLabel, { color: meta.color }]}>{meta.label}</Text>

      <View style={styles.reqGrid}>
        {REQS.map(r => (
          <RequirementRow key={r.key} label={r.label} met={checks[r.key]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: -spacing.xs, marginBottom: spacing.md },
  barTrack: {
    height: 6, borderRadius: 3, backgroundColor: '#ECEBFA',
    overflow: 'hidden', marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: wp(3.1), fontWeight: '700', marginBottom: spacing.xs },
  reqGrid: {
    backgroundColor: '#FBFAFF', borderRadius: 14, padding: spacing.sm + 2,
    borderWidth: 1, borderColor: '#EFEDFF', gap: 6,
  },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reqText: { fontSize: wp(3.1), color: '#9A98B5', fontWeight: '500' },
  reqTextMet: { color: '#3D3B6B' },
});
