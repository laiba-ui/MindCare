// app/index.tsx
// Checks if user is already logged in (token in AsyncStorage)
// If yes → go to tabs, if no → go to splash

import { Redirect } from 'expo-router';
import { getToken } from './utils/api';

export default function RootIndex() {
  const token = getToken();
  // If token exists (loaded from AsyncStorage in _layout.tsx) → go to tabs
  // Otherwise → show splash → login
  if (token) return <Redirect href={'/(tabs)' as any} />;
  return <Redirect href={'/SplashScreen' as any} />;
}