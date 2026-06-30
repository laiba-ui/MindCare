// context/ThemeContext.tsx
// App-wide theme system with:
//  - Light / Dark / System modes
//  - Persisted preference via AsyncStorage
//  - Animated theme switcher button component
//  - useAppTheme() hook for consuming anywhere

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { Appearance, useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text } from 'react-native';

// ─── Token maps ──────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  bg:          string;
  bgSecondary: string;
  card:        string;
  cardBorder:  string;
  gradStart:   string;
  gradEnd:     string;
  textPrimary: string;
  textSecondary: string;
  textFaint:   string;
  inputBg:     string;
  inputBorder: string;
  divider:     string;
  tabBarBg:    string;
  tabBarBorder:string;
  isDark:      boolean;
}

export const LIGHT_TOKENS: ThemeTokens = {
  bg:            '#F7F6FF',
  bgSecondary:   '#EFEDFF',
  card:          '#FFFFFF',
  cardBorder:    '#EDE9FF',
  gradStart:     '#6C63FF',
  gradEnd:       '#A78BFA',
  textPrimary:   '#2D2B55',
  textSecondary: '#6B6A8A',
  textFaint:     '#A0AEBF',
  inputBg:       '#FFFFFF',
  inputBorder:   '#E0DEFF',
  divider:       '#EDE9FF',
  tabBarBg:      '#FFFFFF',
  tabBarBorder:  '#EDE9FF',
  isDark:        false,
};

export const DARK_TOKENS: ThemeTokens = {
  bg:            '#14151E',
  bgSecondary:   '#1E1F28',
  card:          '#24253A',
  cardBorder:    'rgba(255,255,255,0.07)',
  gradStart:     '#6C63FF',
  gradEnd:       '#A78BFA',
  textPrimary:   '#E8E6FF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textFaint:     'rgba(255,255,255,0.30)',
  inputBg:       '#1E1F28',
  inputBorder:   'rgba(255,255,255,0.10)',
  divider:       'rgba(255,255,255,0.08)',
  tabBarBg:      '#1A1B26',
  tabBarBorder:  'rgba(255,255,255,0.07)',
  isDark:        true,
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  mode:      ThemeMode;
  tokens:    ThemeTokens;
  setMode:   (m: ThemeMode) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode:      'system',
  tokens:    LIGHT_TOKENS,
  setMode:   () => {},
  toggleDark: () => {},
});

const STORAGE_KEY = 'mindspace_theme_mode';

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    }).catch(() => {});
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggleDark = useCallback(() => {
    const next = resolvedIsDark(mode, systemScheme) ? 'light' : 'dark';
    setMode(next);
  }, [mode, systemScheme]);

  const isDark = resolvedIsDark(mode, systemScheme);
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;

  return (
    <ThemeContext.Provider value={{ mode, tokens, setMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

function resolvedIsDark(mode: ThemeMode, system: 'light' | 'dark' | null | undefined): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return system === 'dark';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppTheme() {
  return useContext(ThemeContext);
}

// ─── ThemeToggle button ───────────────────────────────────────────────────────
// Drop-in button that shows ☀️/🌙 and calls toggleDark on press.
// Usage: <ThemeToggle />

export function ThemeToggle({ size = 36 }: { size?: number }) {
  const { tokens, toggleDark } = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${(1 - scale.value) * 180}deg` }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={[
          styles.toggleBtn,
          {
            width:           size,
            height:          size,
            borderRadius:    size / 2,
            backgroundColor: tokens.card,
            borderColor:     tokens.cardBorder,
          },
        ]}
        onPressIn={() => { scale.value = withSpring(0.85, { damping: 8 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 8 }); }}
        onPress={toggleDark}
        hitSlop={8}
      >
        <Text style={{ fontSize: size * 0.46 }}>
          {tokens.isDark ? '☀️' : '🌙'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 10px rgba(108,99,255,0.10)' } as any)
      : { shadowColor: '#6C63FF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }),
  },
});
