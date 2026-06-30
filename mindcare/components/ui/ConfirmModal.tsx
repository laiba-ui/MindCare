// components/ui/ConfirmModal.tsx
// Attractive, animated confirm dialog — replaces native two-button
// Alert.alert() confirmations (logout, delete, destructive actions) with a
// premium modal that matches the rest of the design system.
//
// Usage:
//   const confirm = useConfirm();
//   ...
//   const ok = await confirm.ask({ title: 'Log out?', message: '...', danger: true });
//   if (ok) { ...logout... }

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing, radii } from '@/constants/theme';
import PrimaryButton from '@/components/PrimaryButton';

type Options = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

type AskFn = (opts: Options) => Promise<boolean>;
const ConfirmContext = createContext<AskFn | null>(null);

export function useConfirm() {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ask;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const ask = useCallback<AskFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal visible={!!opts} transparent animationType="none" onRequestClose={() => close(false)}>
        {opts && (
          <View style={styles.backdropWrap}>
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFillObject}>
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => close(false)} />
            </Animated.View>

            <Animated.View entering={ZoomIn.duration(220)} exiting={ZoomOut.duration(160)} style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: opts.danger ? '#FFE5E8' : '#EEEAFF' }]}>
                <Ionicons
                  name={opts.icon || (opts.danger ? 'alert-circle' : 'help-circle')}
                  size={wp(8)}
                  color={opts.danger ? '#FF4D5A' : '#6C63FF'}
                />
              </View>
              <Text style={styles.title}>{opts.title}</Text>
              {!!opts.message && <Text style={styles.message}>{opts.message}</Text>}

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={() => close(false)}>
                  <Text style={styles.cancelText}>{opts.cancelLabel || 'Cancel'}</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label={opts.confirmLabel || 'Confirm'}
                    onPress={() => close(true)}
                    colors={opts.danger ? ['#FF4D5A', '#FF8A80'] : undefined}
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdropWrap: {
    flex: 1, backgroundColor: 'rgba(20,18,40,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: radii.xl,
    padding: spacing.lg, alignItems: 'center',
    shadowColor: '#2D2B55', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  iconCircle: { width: wp(16), height: wp(16), borderRadius: wp(8), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title:   { fontSize: wp(5), fontWeight: '800', color: '#2D2B55', textAlign: 'center', marginBottom: spacing.xs },
  message: { fontSize: wp(3.5), color: '#8B89AC', textAlign: 'center', lineHeight: wp(5), marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: '#E8E6FF' },
  cancelText: { fontSize: wp(4), fontWeight: '700', color: '#6C63FF' },
});
