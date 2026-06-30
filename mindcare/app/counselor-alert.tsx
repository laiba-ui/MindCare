// app/counselor-alert.tsx
// Shown automatically when user logs a high-risk mood (score 1: Anxious, Angry, Exhausted, Lonely, Stressed)
// Navigate here from MoodTracker after saving a high-risk entry:
//   router.push({ pathname: '/counselor-alert', params: { mood: label, note: note } })

import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle, Easing, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';

const RESOURCES = [
  { label: 'University Counselor', number: '051-2890505', icon: 'school-outline',      color: '#6C63FF' },
  { label: 'Umang Helpline',       number: '0317-4288665', icon: 'heart-outline',       color: '#A78BFA' },
  { label: 'Emergency Rescue',     number: '1122',          icon: 'call-outline',        color: '#FF4D5A' },
];

export default function CounselorAlert() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mood, note } = useLocalSearchParams<{ mood?: string; note?: string }>();

  // Pulsing ring animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF5F5' }}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + hp(4) }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(450)} style={{ width: '100%', alignItems: 'center' }}>

        {/* Alert icon with pulse */}
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <View style={styles.alertIconCircle}>
          <Text style={styles.alertEmoji}>⚠️</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>We're concerned about you</Text>
        <Text style={styles.subtitle}>
          You logged feeling <Text style={styles.moodHighlight}>{mood || 'distressed'}</Text>
          {note ? ` with a note: "${note}"` : ''}.{'\n'}
          It's okay to not be okay. You're not alone.
        </Text>

        {/* Counselor notified banner */}
        <View style={styles.notifiedBanner}>
          <Ionicons name="checkmark-circle" size={wp(6)} color="#76C893" />
          <View style={{ flex: 1 }}>
            <Text style={styles.notifiedTitle}>Counselor has been notified</Text>
            <Text style={styles.notifiedSub}>Your university counselor has been alerted and will follow up with you.</Text>
          </View>
        </View>

        {/* Self-care message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>💙 Remember</Text>
          <Text style={styles.messageBody}>
            Reaching out is a sign of strength, not weakness. Your feelings are valid and help is available. You deserve support.
          </Text>
        </View>

        {/* Call resources */}
        <Text style={styles.sectionTitle}>Talk to someone right now</Text>
        {RESOURCES.map(r => (
          <TouchableOpacity key={r.number} style={styles.resourceCard} onPress={() => call(r.number)} activeOpacity={0.8}>
            <View style={[styles.resourceIcon, { backgroundColor: r.color + '18' }]}>
              <Ionicons name={r.icon as any} size={wp(5.5)} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resourceLabel}>{r.label}</Text>
              <Text style={styles.resourceNumber}>{r.number}</Text>
            </View>
            <View style={[styles.callBtn, { backgroundColor: r.color }]}>
              <Ionicons name="call" size={wp(4.5)} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Coping tips */}
        <Text style={styles.sectionTitle}>While you wait — try this</Text>
        <View style={styles.tipsCard}>
          {[
            '🌬️  Take 5 slow deep breaths right now',
            '💧  Drink a glass of water',
            '🚶  Step outside for 5 minutes',
            '📝  Write down exactly what you\'re feeling',
            '🎵  Put on your favourite calming music',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipItem}>{tip}</Text>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/ai' as any)} activeOpacity={0.85}>
          <LinearGradient colors={['#6C63FF', '#A78BFA']} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="chatbubble-outline" size={wp(5)} color="#fff" />
            <Text style={styles.primaryBtnText}>Talk to Maia</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)' as any)} activeOpacity={0.75}>
          <Text style={styles.secondaryBtnText}>I'm okay, go to home</Text>
        </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.lg },

  pulseRing: {
    position: 'absolute', top: hp(6),
    width: wp(36), height: wp(36), borderRadius: wp(18),
    backgroundColor: '#FF8A8025',
    borderWidth: 2, borderColor: '#FF8A8060',
  },
  alertIconCircle: {
    width: wp(28), height: wp(28), borderRadius: wp(14),
    backgroundColor: '#FFE8E8', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg, marginTop: wp(4),
    shadowColor: '#FF4D5A', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  alertEmoji: { fontSize: wp(13) },

  title:    { fontSize: wp(6.5), fontWeight: '800', color: '#2D2B55', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: wp(3.8), color: '#6B6A8A', textAlign: 'center', lineHeight: wp(5.8), marginBottom: spacing.lg },
  moodHighlight: { color: '#FF4D5A', fontWeight: '700' },

  notifiedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#E8FFF4', borderRadius: 16, padding: spacing.md,
    width: '100%', marginBottom: spacing.md,
    borderWidth: 1.5, borderColor: '#76C893',
  },
  notifiedTitle: { fontSize: wp(3.8), fontWeight: '700', color: '#2D2B55' },
  notifiedSub:   { fontSize: wp(3.2), color: '#6B6A8A', marginTop: 3, lineHeight: wp(5) },

  messageCard: {
    backgroundColor: '#EDE9FF', borderRadius: 16, padding: spacing.md,
    width: '100%', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#C4B5FD',
    borderLeftWidth: 4, borderLeftColor: '#6C63FF',
  },
  messageTitle: { fontSize: wp(4.2), fontWeight: '700', color: '#2D2B55', marginBottom: spacing.xs },
  messageBody:  { fontSize: wp(3.5), color: '#6B6A8A', lineHeight: wp(5.5) },

  sectionTitle: { fontSize: wp(4), fontWeight: '700', color: '#2D2B55', alignSelf: 'flex-start', marginBottom: spacing.sm },

  resourceCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#fff', borderRadius: 18, padding: spacing.md,
    width: '100%', marginBottom: spacing.sm,
    shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  resourceIcon:   { width: wp(11), height: wp(11), borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resourceLabel:  { fontSize: wp(3.8), fontWeight: '700', color: '#2D2B55' },
  resourceNumber: { fontSize: wp(3.2), color: '#6B6A8A', marginTop: 2 },
  callBtn:        { width: wp(11), height: wp(11), borderRadius: wp(5.5), alignItems: 'center', justifyContent: 'center' },

  tipsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: spacing.md,
    width: '100%', marginBottom: spacing.lg, gap: spacing.sm,
    shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  tipItem: { fontSize: wp(3.6), color: '#2D2B55', lineHeight: wp(5.5) },

  primaryBtn:     { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: spacing.sm },
  primaryBtnGrad: { paddingVertical: spacing.md + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: 18 },
  primaryBtnText: { fontSize: wp(4.5), fontWeight: '700', color: '#fff' },

  secondaryBtn:     { paddingVertical: spacing.md, alignItems: 'center', width: '100%' },
  secondaryBtnText: { fontSize: wp(3.8), color: '#AAA', fontWeight: '500' },
});