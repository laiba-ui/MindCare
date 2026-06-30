// app/(auth)/signup.tsx
// Premium responsive signup screen — mirrors login.tsx's split-screen /
// glass-card layout. All signup logic (handleSignup, api call, saveAuth,
// validation thresholds) is unchanged from the original implementation.

import { useState, useEffect } from 'react';
import {
  StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform,
  Text, ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInLeft, useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '../utils/responsive';
import { spacing, gradients } from '@/constants/theme';
import { api, saveAuth } from '../utils/api';
import ErrorBanner from '@/components/ErrorBanner';
import PrimaryButton from '@/components/PrimaryButton';
import PasswordStrength from '@/components/auth/PasswordStrength';
import PasswordMatchHint from '@/components/auth/PasswordMatchHint';
import GlassCard from '@/components/ui/GlassCard';
import FloatingBlob from '@/components/ui/FloatingBlob';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import { useToast } from '@/components/ui/ToastProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WIDE_BREAKPOINT = 768;

const FEATURES = [
  { icon: '🔒', text: 'Your data stays private' },
  { icon: '🤝', text: 'Free for every student' },
  { icon: '🌱', text: 'Build healthier daily habits' },
];

function BrandPanel({ wide }: { wide: boolean }) {
  return (
    <LinearGradient colors={gradients.brand} style={[styles.brandPanel, wide && styles.brandPanelWide]}>
      <FloatingBlob size={wide ? 220 : wp(32)} color="rgba(255,255,255,0.10)" top={wide ? 40 : -hp(6)} left={wide ? -60 : -wp(12)} duration={5200} />
      <FloatingBlob size={wide ? 150 : wp(24)} color="rgba(255,255,255,0.08)" bottom={wide ? 60 : -hp(4)} right={wide ? -40 : -wp(8)} duration={4400} delay={300} />

      <Animated.View entering={FadeInLeft.duration(500)} style={styles.brandContent}>
        <View style={styles.heroBadge}><Text style={styles.heroEmoji}>✨</Text></View>
        <Text style={styles.brandTitle}>Join MindSpace</Text>
        <Text style={styles.brandSub}>Start your wellness journey{'\n'}— it only takes a minute.</Text>

        {wide && (
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <Animated.View key={f.text} entering={FadeInDown.delay(200 + i * 90).duration(420)} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(percent, { duration: 320 });
  }, [percent]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.progressOuter}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(percent)}% complete</Text>
    </View>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [uni,      setUni]      = useState('');
  const [year,     setYear]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const isEmailValid = EMAIL_RE.test(email.trim());

  // Lightweight "account creation" progress — purely visual encouragement,
  // does not gate submission (submission rules are unchanged below).
  const fieldsFilled = [
    name.trim().length > 0,
    isEmailValid,
    uni.trim().length > 0,
    year.trim().length > 0,
    password.length >= 6,
    confirm.length > 0 && confirm === password,
  ].filter(Boolean).length;
  const progressPercent = (fieldsFilled / 6) * 100;

  const handleSignup = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim())
      return setError('Name, email and password are required.');
    if (password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (password !== confirm)
      return setError('Passwords do not match.');
    setLoading(true);
    try {
      const data = await api('/auth/register', 'POST', {
        name: name.trim(), email: email.trim().toLowerCase(),
        password, university: uni.trim(), year: year.trim(),
      });
      saveAuth(data.token, data.user);
      toast.success('Account created! 🎉', `Welcome to MindSpace, ${name.trim().split(' ')[0]}.`);
      onSuccess();
      // Route through welcome screen for the onboarding character animation
      setTimeout(() => router.replace({ pathname: '/welcome' as any, params: { name: name.trim() } }), 1100);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInDown.duration(380)}>
        <Text style={styles.sectionTitle}>Create Account</Text>
        <Text style={styles.sectionSub}>Let's get you set up in a few seconds</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(30).duration(380)}>
        <ProgressBar percent={progressPercent} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(50).duration(380)}>
        <FloatingLabelInput icon="person-outline" label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(90).duration(380)}>
        <FloatingLabelInput
          icon="mail-outline" label="University email" value={email} onChangeText={setEmail}
          keyboardType="email-address" success={email.length > 0 && isEmailValid}
          error={email.length > 4 && !isEmailValid}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(130).duration(380)}>
        <FloatingLabelInput icon="school-outline" label="University / College" value={uni} onChangeText={setUni} autoCapitalize="words" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(170).duration(380)}>
        <FloatingLabelInput icon="calendar-outline" label="Study year (e.g. 2nd Year)" value={year} onChangeText={setYear} autoCapitalize="words" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(210).duration(380)}>
        <FloatingLabelInput icon="lock-closed-outline" label="Password (min 6 chars)" value={password} onChangeText={setPassword} secure />
      </Animated.View>
      <PasswordStrength password={password} />

      <Animated.View entering={FadeInDown.delay(250).duration(380)}>
        <FloatingLabelInput icon="shield-checkmark-outline" label="Confirm password" value={confirm} onChangeText={setConfirm} secure />
      </Animated.View>
      <PasswordMatchHint password={password} confirm={confirm} />

      <ErrorBanner message={error} />

      <View style={styles.termsRow}>
        <Ionicons name="checkmark-circle" size={wp(5)} color="#6C63FF" />
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      <PrimaryButton label="Create Account 🚀" loadingLabel="Creating account..." loading={loading} onPress={handleSignup} />

      <TouchableOpacity onPress={() => router.push('/login' as any)} style={styles.switchRow}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <Text style={styles.switchLink}>Sign In</Text>
      </TouchableOpacity>
    </>
  );
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const [success, setSuccess] = useState(false);

  if (wide) {
    return (
      <>
        <View style={styles.wideRoot}>
          <BrandPanel wide />
          <View style={styles.formPanelWide}>
            <ScrollView contentContainerStyle={styles.formPanelWideContent} showsVerticalScrollIndicator={false}>
              <View style={{ width: '100%', maxWidth: 420 }}>
                <SignupForm onSuccess={() => setSuccess(true)} />
              </View>
            </ScrollView>
          </View>
        </View>
        <SuccessOverlay visible={success} title="Welcome aboard! 🎉" subtitle="Your account is ready — taking you in..." />
      </>
    );
  }

  return (
    <>
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
              <View style={styles.heroBadgeSm}><Text style={styles.heroEmojiSm}>✨</Text></View>
              <Text style={styles.narrowAppName}>Join MindSpace</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(420)}>
              <GlassCard variant="onLight" style={styles.narrowCard}>
                <SignupForm onSuccess={() => setSuccess(true)} />
              </GlassCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <SuccessOverlay visible={success} title="Welcome aboard! 🎉" subtitle="Your account is ready — taking you in..." />
    </>
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
  featureEmoji: { fontSize: 20 },
  featureText: { fontSize: 15, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  formPanelWide: { flex: 1 },
  formPanelWideContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  // ── Narrow / phone ─────────────────────────────────────────────────────
  narrowScroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  narrowLogo: { alignItems: 'center', marginBottom: spacing.lg },
  heroBadgeSm: { width: wp(15), height: wp(15), borderRadius: wp(7.5), backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  heroEmojiSm: { fontSize: wp(7.5) },
  narrowAppName: { fontSize: wp(5.6), fontWeight: '800', color: '#fff', letterSpacing: 0.5, textAlign: 'center' },
  narrowCard: { width: '100%', maxWidth: 430, padding: spacing.lg },

  // ── Shared brand badge (wide) ──────────────────────────────────────────
  heroBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroEmoji: { fontSize: 28 },
  brandTitle: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 0.6, marginBottom: spacing.sm },
  brandSub: { fontSize: 16, color: 'rgba(255,255,255,0.88)', lineHeight: 24 },

  // ── Form (shared by both layouts) ─────────────────────────────────────
  sectionTitle: { fontSize: wp(6), fontWeight: '800', color: '#2D2B55', marginBottom: 4 },
  sectionSub:   { fontSize: wp(3.3), color: '#8B89AC', marginBottom: spacing.lg },
  termsRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.xs },
  termsText:   { flex: 1, fontSize: wp(3), color: '#8B89AC', lineHeight: wp(4.4) },
  termsLink:   { color: '#6C63FF', fontWeight: '600' },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  switchText:  { fontSize: wp(3.6), color: '#888' },
  switchLink:  { fontSize: wp(3.6), color: '#6C63FF', fontWeight: '700' },
  progressOuter: { marginBottom: spacing.md },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#ECEBFA', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4, backgroundColor: '#6C63FF' },
  progressLabel: { fontSize: wp(2.9), color: '#9A98B5', fontWeight: '600', marginTop: 4, textAlign: 'right' },
});
