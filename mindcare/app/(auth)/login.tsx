// app/(auth)/login.tsx
// Premium responsive auth screen:
//  - Wide viewports (tablet/web ≥768px): split-screen — branded gradient
//    panel with floating blobs on the left, clean centered form on the right.
//  - Narrow viewports (phone): single column — gradient + blobs background
//    with a frosted glass-card form centered on top.
// All login logic (handleLogin, api call, saveAuth, routing) is unchanged.

import React, { useState, useEffect } from 'react';

import {
  StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform,
  Text, ScrollView, Pressable, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInDown, FadeInLeft,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '../utils/responsive';
import { spacing, gradients } from '@/constants/theme';
import { api, saveAuth } from '../utils/api';
import ErrorBanner from '@/components/ErrorBanner';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/ui/GlassCard';
import FloatingBlob from '@/components/ui/FloatingBlob';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { useToast } from '@/components/ui/ToastProvider';

const WIDE_BREAKPOINT = 768;



const FEATURES = [
  { icon: 'shield-checkmark-outline', text: 'Private & confidential' },
  { icon: 'sparkles-outline',         text: 'AI-powered support, 24/7' },
  { icon: 'trending-up-outline',      text: 'Track your wellbeing over time' },
];

function BrandPanel({ wide }: { wide: boolean }) {
  return (
    <LinearGradient colors={gradients.brand} style={[styles.brandPanel, wide && styles.brandPanelWide]}>
      <FloatingBlob size={wide ? 220 : wp(32)} color="rgba(255,255,255,0.10)" top={wide ? 40 : -hp(6)} left={wide ? -60 : -wp(12)} duration={5200} />
      <FloatingBlob size={wide ? 150 : wp(24)} color="rgba(255,255,255,0.08)" bottom={wide ? 60 : -hp(4)} right={wide ? -40 : -wp(8)} duration={4400} delay={300} />

      <Animated.View entering={FadeInLeft.duration(500)} style={styles.brandContent}>
        <View style={styles.heroBadge}><Text style={styles.heroEmoji}>🧠</Text></View>
        <Text style={styles.brandTitle}>MindSpace</Text>
        <Text style={styles.brandSub}>Welcome back 💙{'\n'}Your wellness journey continues here.</Text>

        {wide && (
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <Animated.View key={f.text} entering={FadeInDown.delay(200 + i * 90).duration(420)} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={13} color="#fff" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const REMEMBER_KEY = 'mindspace_remembered_email';

function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [rememberMe, setRememberMe] = useState(false);



  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_KEY).then(saved => {
      if (saved) { setEmail(saved); setRememberMe(true); }
    }).catch(() => {});
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await api('/auth/login', 'POST', {
        email: email.trim().toLowerCase(), password,
      });
      // ✅ Save token + full user object so all screens can read it
      saveAuth(data.token, data.user);
      // Remember Me — purely a local convenience, never touches auth logic
      AsyncStorage.setItem(REMEMBER_KEY, rememberMe ? email.trim() : '').catch(() => {});
      toast.success('Welcome back! 👋', `Good to see you, ${(data.user?.name || 'there').split(' ')[0]}.`);
      // Route through welcome screen so the psychologist character & confetti play
      router.replace({ pathname: '/welcome' as any, params: { name: data.user?.name || 'Friend' } });
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInDown.duration(380)}>
        <Text style={styles.sectionTitle}>Sign In</Text>
        <Text style={styles.sectionSub}>Enter your details to access your account</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(380)}>
        <FloatingLabelInput icon="mail-outline" label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(140).duration(380)}>
        <FloatingLabelInput icon="lock-closed-outline" label="Password" value={password} onChangeText={setPassword} secure />
      </Animated.View>

      <ErrorBanner message={error} />

      <View style={styles.rememberRow}>
        <Pressable style={styles.rememberLeft} onPress={() => setRememberMe(r => !r)} hitSlop={8}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={wp(3.4)} color="#fff" />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton label="Sign In" loadingLabel="Signing in..." loading={loading} onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.push('/signup' as any)} style={styles.switchRow}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <Text style={styles.switchLink}>Sign Up</Text>
      </TouchableOpacity>
    </>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  if (wide) {
    return (
      <View style={styles.wideRoot}>
        <BrandPanel wide />
        <View style={styles.formPanelWide}>
          <ScrollView contentContainerStyle={styles.formPanelWideContent} showsVerticalScrollIndicator={false}>
            <View style={{ width: '100%', maxWidth: 420 }}>
              <LoginForm />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFillObject} />
      <FloatingBlob size={wp(38)} color="rgba(255,255,255,0.10)" top={-hp(6)} left={-wp(14)} duration={5200} />
      <FloatingBlob size={wp(28)} color="rgba(255,255,255,0.08)" bottom={hp(8)} right={-wp(10)} duration={4400} delay={300} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.narrowScroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(450)} style={styles.narrowLogo}>
            <View style={styles.heroBadgeSm}><Text style={styles.heroEmojiSm}>🧠</Text></View>
            <Text style={styles.narrowAppName}>MindSpace</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <GlassCard variant="onLight" style={styles.narrowCard}>
              <LoginForm />
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Wide / split-screen ────────────────────────────────────────────────
  wideRoot: { flex: 1, flexDirection: 'row', backgroundColor: '#F7F6FF' },
  brandPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: spacing.xl },
  brandPanelWide: { maxWidth: 560 },
  brandContent: { alignItems: 'flex-start', width: '100%', maxWidth: 380 },
  featureList: { marginTop: 36, gap: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 15, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  formPanelWide: { flex: 1 },
  formPanelWideContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  // ── Narrow / phone ─────────────────────────────────────────────────────
  narrowScroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  narrowLogo: { alignItems: 'center', marginBottom: spacing.lg },
  heroBadgeSm: { width: wp(15), height: wp(15), borderRadius: wp(7.5), backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  heroEmojiSm: { fontSize: wp(7.5) },
  narrowAppName: { fontSize: wp(6), fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  narrowCard: { width: '100%', maxWidth: 430, padding: spacing.lg },

  // ── Shared brand badge (wide) ──────────────────────────────────────────
  heroBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroEmoji: { fontSize: 28 },
  brandTitle: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 0.6, marginBottom: spacing.sm },
  brandSub: { fontSize: 16, color: 'rgba(255,255,255,0.88)', lineHeight: 24 },

  // ── Form (shared by both layouts) ─────────────────────────────────────
  sectionTitle: { fontSize: wp(6.5), fontWeight: '800', color: '#2D2B55', marginBottom: 4 },
  sectionSub:   { fontSize: wp(3.3), color: '#8B89AC', marginBottom: spacing.lg },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, marginTop: -spacing.xs },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkbox: { width: wp(5), height: wp(5), borderRadius: 6, borderWidth: 1.5, borderColor: '#C7C5DE', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  rememberText: { fontSize: wp(3.4), color: '#6B6A8A', fontWeight: '600' },
  forgotText:{ fontSize: wp(3.4), color: '#6C63FF', fontWeight: '600' },
  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0DEFF' },
  dividerText: { fontSize: wp(3.2), color: '#AAA', marginHorizontal: spacing.sm },
  socialRow:   { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  socialBtn:   { width: wp(13), height: wp(13), borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E6FF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xs },
  switchText:  { fontSize: wp(3.6), color: '#888' },
  switchLink:  { fontSize: wp(3.6), color: '#6C63FF', fontWeight: '700' },
});
