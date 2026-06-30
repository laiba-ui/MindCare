// app/(auth)/_layout.tsx
// ✅ This Stack navigator is what makes /(auth)/login and /(auth)/signup resolve properly.
// Make sure this file exists at exactly: app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
       <Stack.Screen name="forgot-password" />  
    </Stack>
  );
}