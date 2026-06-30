// components/ui/ToastProvider.tsx
// Global, animated toast notification system — replaces native Alert.alert
// popups across the app with a modern, non-blocking, auto-dismissing card.
// Usage:  const toast = useToast();  toast.success('Saved!', 'Your changes were saved.');

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeOutUp, LinearTransition, useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '@/app/utils/responsive';
import { spacing, radii, semantic } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastItem = { id: string; type: ToastType; title: string; message?: string };

const META: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: semantic.success, bg: '#EAFBF1' },
  error:   { icon: 'close-circle',     color: semantic.error,   bg: '#FFF0F1' },
  warning: { icon: 'warning',          color: semantic.warning, bg: '#FFF6E8' },
  info:    { icon: 'information-circle', color: semantic.info,  bg: '#EAF6FE' },
};

const DURATION = 3400;

type ShowFn = (type: ToastType, title: string, message?: string) => void;
const ToastContext = createContext<ShowFn | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within <ToastProvider>');
  return {
    success: (title: string, message?: string) => show('success', title, message),
    error:   (title: string, message?: string) => show('error', title, message),
    warning: (title: string, message?: string) => show('warning', title, message),
    info:    (title: string, message?: string) => show('info', title, message),
  };
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const meta = META[toast.type];
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: DURATION });
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      exiting={FadeOutUp.duration(220)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: meta.bg, borderColor: meta.color + '33' }]}
    >
      <Pressable style={styles.row} onPress={onDismiss}>
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={wp(5.2)} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          {!!toast.message && <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>}
        </View>
        <Ionicons name="close" size={wp(4)} color="#999" />
      </Pressable>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle, { backgroundColor: meta.color }]} />
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();
  const counter = useRef(0);

  const show = useCallback<ShowFn>((type, title, message) => {
    const id = `t${Date.now()}_${counter.current++}`;
    setToasts(prev => [{ id, type, title, message }, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURATION);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
        {toasts.map(t => <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />)}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 999, gap: spacing.xs,
  },
  card: {
    width: '92%', maxWidth: 440, borderRadius: radii.lg, borderWidth: 1,
    overflow: 'hidden', marginBottom: spacing.xs,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 10px 28px rgba(45,43,85,0.16)' } as any)
      : { shadowColor: '#2D2B55', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm + 2 },
  iconWrap: { width: wp(9), height: wp(9), borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: wp(3.6), fontWeight: '700', color: '#2D2B55' },
  message: { fontSize: wp(3.1), color: '#6B6A8A', marginTop: 1 },
  barTrack: { height: 3, backgroundColor: 'rgba(0,0,0,0.06)' },
  barFill:  { height: '100%' },
});
