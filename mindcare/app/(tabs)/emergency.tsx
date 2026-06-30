// app/(tabs)/emergency.tsx

import { StyleSheet, TouchableOpacity, Pressable, Linking, View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, withRepeat, withSequence,
  withTiming, useAnimatedStyle, Easing, FadeInDown,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HELPLINES = [
  { label: 'Umang Helpline',    number: '0317-4288665', icon: 'heart-outline',    color: '#FF6B6B' },
  { label: 'Rozan Counseling',  number: '051-2890505',  icon: 'chatbubble-outline', color: '#A78BFA' },
  { label: 'Rescue / Emergency',number: '1122',         icon: 'call-outline',     color: '#FF4D5A' },
];

function HelplineCard({ h, onCall }: { h: typeof HELPLINES[0]; onCall: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={styles.helpCard}
        onPress={onCall}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      >
        <View style={[styles.helpIcon, { backgroundColor: h.color + '22' }]}>
          <Ionicons name={h.icon as any} size={wp(5.5)} color={h.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.helpLabel}>{h.label}</Text>
          <Text style={styles.helpNumber}>{h.number}</Text>
        </View>
        <Ionicons name="call-outline" size={wp(5)} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

export default function EmergencyScreen() {
  const pulse = useSharedValue(1);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 850, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <LinearGradient colors={['#FF758C', '#FF9AA2']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.iconRing}>
          <Text style={styles.iconEmoji}>🚨</Text>
        </Animated.View>

        {/* ✅ Title — paddingHorizontal ensures "E" never clips */}
        <Animated.Text entering={FadeInDown.delay(60).duration(420)} style={styles.title}>Emergency Help</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(110).duration(420)} style={styles.subtitle}>
          You are not alone. Reach out immediately if you're in distress.
        </Animated.Text>

        {/* Main pulsing call button */}
        <Animated.View style={[styles.mainBtnWrap, pulseStyle]}>
          <TouchableOpacity style={styles.mainBtn} onPress={() => call('1122')} activeOpacity={0.85}>
            <Ionicons name="call" size={wp(7)} color="#fff" />
            <Text style={styles.mainBtnText}>Call 1122</Text>
            <Text style={styles.mainBtnSub}>Emergency Rescue</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>More helplines</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Other helplines */}
        {HELPLINES.map((h, i) => (
          <Animated.View key={h.number} entering={FadeInDown.delay(180 + i * 70).duration(380)} style={{ width: '100%' }}>
            <HelplineCard h={h} onCall={() => call(h.number)} />
          </Animated.View>
        ))}

        {/* Safety message */}
        <Animated.View entering={FadeInDown.delay(420).duration(420)} style={styles.safetyBox}>
          <Text style={styles.safetyText}>
            💙 If you feel unsafe, please call someone you trust or go to your nearest hospital.
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,  // ✅ prevents any edge clipping
  },

  iconRing: {
    width: wp(22), height: wp(22), borderRadius: wp(11),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: { fontSize: wp(11) },

  // ✅ textAlign center + paddingHorizontal + width 100% = never clips
  title: {
    fontSize: wp(8),
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: wp(3.8),
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: wp(5.8),
    marginBottom: spacing.xl,
  },

  // Main button
  mainBtnWrap: { width: '100%', marginBottom: spacing.xl },
  mainBtn: {
    backgroundColor: '#FF4D5A',
    borderRadius: 24,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: '#FF4D5A',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  mainBtnText: { fontSize: wp(6), fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  mainBtnSub:  { fontSize: wp(3.3), color: 'rgba(255,255,255,0.8)' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing.md, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerText: { fontSize: wp(3.2), color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  // Helpline cards
  helpCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18, padding: spacing.md,
    width: '100%', marginBottom: spacing.sm, gap: spacing.sm,
  },
  helpIcon: { width: wp(11), height: wp(11), borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  helpLabel:  { fontSize: wp(3.8), fontWeight: '700', color: '#fff' },
  helpNumber: { fontSize: wp(3.2), color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Safety
  safetyBox: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: spacing.md, width: '100%',
  },
  safetyText: {
    fontSize: wp(3.4), color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', lineHeight: wp(5.2),
  },
});