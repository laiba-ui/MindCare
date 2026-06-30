import { useState, useEffect } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, Platform, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import ErrorBanner from '@/components/ErrorBanner';
import PrimaryButton from '@/components/PrimaryButton';
import { api } from '../utils/api';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step,        setStep]        = useState<Step>('email');
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showPass,    setShowPass]    = useState(false);

  const cardY  = useSharedValue(40);
  const cardOp = useSharedValue(0);
  useEffect(() => {
    cardOp.value = withTiming(1, { duration: 500 });
    cardY.value  = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
  }, []);
  const cardAnim = useAnimatedStyle(() => ({
    opacity: cardOp.value, transform: [{ translateY: cardY.value }],
  }));

  const tickScale = useSharedValue(0);
  const tickAnim  = useAnimatedStyle(() => ({ transform: [{ scale: tickScale.value }] }));

  // ── STEP 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError('');
    if (!email.trim())      { setError('Please enter your email address.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await api('/auth/forgot-password', 'POST', { email });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim() || otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await api('/auth/verify-otp', 'POST', { email, otp });
      setStep('newPassword');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPass)             { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api('/auth/reset-password', 'POST', { email, otp, newPassword });
      setStep('done');
      tickScale.value = withSpring(1, { damping: 6, stiffness: 120 });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const heroEmoji = step === 'done' ? '✅' : step === 'otp' ? '📧' : step === 'newPassword' ? '🔑' : '🔐';
  const heroTitle = step === 'done' ? 'Password Reset!' : step === 'otp' ? 'Check Your Email' : step === 'newPassword' ? 'New Password' : 'Forgot Password?';
  const heroSub   = step === 'done' ? 'You can now sign in with your new password'
                  : step === 'otp'  ? `We sent a 6-digit OTP to ${email}`
                  : step === 'newPassword' ? 'Choose a strong new password'
                  : "No worries — we'll send you an OTP";

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <LinearGradient
        colors={['#6C63FF', '#A78BFA']}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(6)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroBadge}>
          <Text style={styles.heroEmoji}>{heroEmoji}</Text>
        </View>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroSub}>{heroSub}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View style={[styles.sheet, cardAnim]}>

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <View>
              <Text style={styles.sectionTitle}>Enter your email</Text>
              <Text style={styles.sectionSub}>We'll send a 6-digit OTP to your registered email.</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={wp(5)} color="#B0B0C8" style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="your@university.edu"
                  placeholderTextColor="#C0BFCF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <ErrorBanner message={error} />
              <PrimaryButton
                label="Send OTP 📧"
                loadingLabel="Sending..."
                loading={loading}
                onPress={handleSendOtp}
                style={{ marginTop: spacing.lg }}
              />
              <TouchableOpacity style={styles.backToLogin} onPress={() => router.back()}>
                <Ionicons name="arrow-back-outline" size={wp(4)} color="#6C63FF" />
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <View>
              <Text style={styles.sectionTitle}>Enter OTP</Text>
              <Text style={styles.sectionSub}>Enter the 6-digit code we sent to your email. It expires in 10 minutes.</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={wp(5)} color="#B0B0C8" style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={otp}
                  onChangeText={(t) => { setOtp(t.replace(/[^0-9]/g, '')); setError(''); }}
                  placeholder="123456"
                  placeholderTextColor="#C0BFCF"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { letterSpacing: 8, fontSize: wp(5) }]}
                />
              </View>
              <ErrorBanner message={error} />
              <PrimaryButton
                label="Verify OTP ✅"
                loadingLabel="Verifying..."
                loading={loading}
                onPress={handleVerifyOtp}
                style={{ marginTop: spacing.lg }}
              />
              <TouchableOpacity style={styles.backToLogin} onPress={() => { setStep('email'); setError(''); }}>
                <Ionicons name="arrow-back-outline" size={wp(4)} color="#6C63FF" />
                <Text style={styles.backToLoginText}>Back — change email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp}>
                <Text style={styles.resendText}>Didn't receive it? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 'newPassword' && (
            <View>
              <Text style={styles.sectionTitle}>Set New Password</Text>
              <Text style={styles.sectionSub}>Choose a strong password with at least 6 characters.</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={wp(5)} color="#B0B0C8" style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setError(''); }}
                  placeholder="New password"
                  placeholderTextColor="#C0BFCF"
                  secureTextEntry={!showPass}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={wp(5)} color="#B0B0C8" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { marginTop: spacing.sm }]}>
                <Ionicons name="lock-closed-outline" size={wp(5)} color="#B0B0C8" style={{ marginRight: spacing.sm }} />
                <TextInput
                  value={confirmPass}
                  onChangeText={(t) => { setConfirmPass(t); setError(''); }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#C0BFCF"
                  secureTextEntry={!showPass}
                  style={styles.input}
                />
              </View>
              <ErrorBanner message={error} />
              <PrimaryButton
                label="Reset Password 🔑"
                loadingLabel="Resetting..."
                loading={loading}
                onPress={handleResetPassword}
                style={{ marginTop: spacing.lg }}
              />
            </View>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && (
            <View style={styles.sentContent}>
              <Animated.View style={[styles.tickCircle, tickAnim]}>
                <Ionicons name="checkmark" size={wp(12)} color="#6C63FF" />
              </Animated.View>
              <Text style={styles.sentTitle}>Password Reset! 🎉</Text>
              <Text style={styles.sentBody}>
                Your password has been updated successfully.{'\n\n'}
                You can now sign in with your new password.
              </Text>
              <PrimaryButton
                label="Go to Sign In"
                onPress={() => router.replace('/login' as any)}
              />
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero:         { paddingHorizontal: spacing.lg, paddingBottom: hp(5), alignItems: 'center' },
  backBtn:      { position: 'absolute', top: hp(6), left: spacing.md, padding: 4 },
  heroBadge:    { width: wp(17), height: wp(17), borderRadius: wp(8.5), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, marginTop: spacing.md },
  heroEmoji:    { fontSize: wp(9) },
  heroTitle:    { fontSize: wp(7), fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  heroSub:      { fontSize: wp(3.6), color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  sheet:        { backgroundColor: '#F7F6FF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -hp(3.5), padding: spacing.lg, flex: 1 },
  sectionTitle: { fontSize: wp(6), fontWeight: '800', color: '#2D2B55', marginBottom: spacing.xs },
  sectionSub:   { fontSize: wp(3.6), color: '#6B6A8A', marginBottom: spacing.lg, lineHeight: wp(5.5) },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderWidth: 1.5, borderColor: '#E8E6FF', shadowColor: '#6C63FF', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  input:        { flex: 1, fontSize: wp(3.9), color: '#2D2B55' },
  backToLogin:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  backToLoginText: { fontSize: wp(3.6), color: '#6C63FF', fontWeight: '600' },
  resendBtn:    { marginTop: spacing.md, alignItems: 'center' },
  resendText:   { fontSize: wp(3.5), color: '#6C63FF', fontWeight: '600' },
  sentContent:  { alignItems: 'center', paddingTop: spacing.lg },
  tickCircle:   { width: wp(24), height: wp(24), borderRadius: wp(12), backgroundColor: '#EDE9FF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 3, borderColor: '#6C63FF' },
  sentTitle:    { fontSize: wp(6), fontWeight: '800', color: '#2D2B55', marginBottom: spacing.sm },
  sentBody:     { fontSize: wp(3.7), color: '#6B6A8A', textAlign: 'center', lineHeight: wp(5.8), marginBottom: spacing.xl, paddingHorizontal: spacing.md },
});