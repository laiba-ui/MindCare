// app/_layout.tsx
// ✅ Loads token from AsyncStorage on every app start
// So profile/home works correctly even after reload

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { loadAuth, getToken } from './utils/api';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';
import { ThemeProvider } from '@/context/ThemeContext';

function BootSpinner() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.bootRoot}>
      <Animated.View style={[styles.bootRing, ringStyle]} />
      <View style={styles.bootBadge}><Text style={styles.bootEmoji}>🧠</Text></View>
      <Text style={styles.bootText}>MindSpace</Text>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load saved token + user from AsyncStorage before rendering any screen
    loadAuth().finally(() => setReady(true));
  }, []);

  // Show branded boot animation while loading auth
  if (!ready) {
    return <BootSpinner />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 260 }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="SplashScreen" options={{ animation: 'fade' }} />
            <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="progress" />
            <Stack.Screen name="micro-goals" />
            <Stack.Screen name="profile-settings" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="notifications-settings" />
            <Stack.Screen name="privacy-security" />
            <Stack.Screen name="language-settings" />
            <Stack.Screen name="achievements" />
            <Stack.Screen name="help-center" />
            <Stack.Screen name="send-feedback" />
            <Stack.Screen name="about" />
            <Stack.Screen name="counselor-alert" options={{ animation: 'fade' }} />
          </Stack>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  bootRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F6FF' },
  bootRing: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: '#D9D5FF',
  },
  bootBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#EEEAFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  bootEmoji: { fontSize: 36 },
  bootText: { fontSize: 18, fontWeight: '800', color: '#2D2B55', letterSpacing: 0.4 },
});