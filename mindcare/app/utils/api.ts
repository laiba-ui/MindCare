// app/utils/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL — AUTO-DETECTED
//
// On Web  → always localhost
// On Mobile (Expo Go / dev build) → reads the host IP automatically from
//   Expo's manifest so you never need to hard-code your WiFi IP again.
//   It extracts the IP from the QR-code URL that Expo already knows about.
//
// ONLY requirement: phone and laptop must be on the SAME WiFi network.
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOM_IP_KEY = 'mindcare_custom_server_ip';
let _customIp: string | null = null;

function getBaseUrl(): string {
  // 1. Always use localhost on web
  if (Platform.OS === 'web') return 'http://localhost:5000/api';

  // 2. If user manually set a custom IP (standalone APK), use that
  if (_customIp) return `http://${_customIp}:5000/api`;

  // 3. Try to grab the dev-server host from Expo's manifest (Expo Go only)
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ??
    (Constants.manifest as any)?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') return `http://${ip}:5000/api`;
  }

  // 4. Fallback default
  return 'http://192.168.0.107:5000/api';
}

export let BASE_URL = getBaseUrl();

// ── Load custom IP on app start (for standalone APK) ──────────────────────────
export const loadCustomServerIp = async () => {
  try {
    const saved = await AsyncStorage.getItem(CUSTOM_IP_KEY);
    if (saved) {
      _customIp = saved;
      BASE_URL = getBaseUrl();
    }
  } catch (_) {}
};

// ── Set a new custom IP (called from Settings screen) ──────────────────────────
export const setCustomServerIp = async (ip: string) => {
  _customIp = ip.trim();
  BASE_URL = getBaseUrl();
  try {
    await AsyncStorage.setItem(CUSTOM_IP_KEY, _customIp);
  } catch (_) {}
};

// ── Get current custom IP (for displaying in settings) ──────────────────────────
export const getCustomServerIp = () => _customIp;

// In-memory cache for fast access during session
let _token: string | null = null;
let _user:  any           = null;

const TOKEN_KEY = 'userToken';
const USER_KEY  = 'userData';

// ── Called once on app start in _layout.tsx ───────────────────────────────────
export const loadAuth = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const user  = await AsyncStorage.getItem(USER_KEY);
    _token = token || null;
    _user  = user ? JSON.parse(user) : null;
  } catch (_) {}
};

// ── Save after login / signup ─────────────────────────────────────────────────
export const saveAuth = async (token: string, user: any) => {
  _token = token;
  _user  = user;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (_) {}
};

// ── Getters ───────────────────────────────────────────────────────────────────
export const getToken = () => _token;

// Async version for file upload use cases that run outside the normal api() flow
export const getAuthToken = async (): Promise<string> => {
  if (_token) return _token;
  // Fallback: read directly from storage (e.g. after app cold-start)
  const stored = await AsyncStorage.getItem('mindspace_token');
  return stored || '';
};
export const getUser  = () => _user;

// ── Logout ────────────────────────────────────────────────────────────────────
export const clearAuth = async () => {
  _token = null;
  _user  = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (_) {}
};

// ── Update local user cache after profile edit ────────────────────────────────
export const updateUserCache = async (updatedUser: any) => {
  _user = { ..._user, ...updatedUser };
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(_user));
  } catch (_) {}
};

// ── Generic API caller ────────────────────────────────────────────────────────
export const api = async (
  endpoint: string,
  method:   'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?:    object,
  auth:     boolean = false,
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth && _token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
};