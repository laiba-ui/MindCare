// components/ui/SuccessOverlay.tsx
// Brief full-screen celebration overlay shown after a major success moment
// (account created, mood saved milestone, etc.) before navigating away.
// Purely presentational — the caller decides timing/navigation.

import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing, gradients } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
};

export default function SuccessOverlay({ visible, title, subtitle }: Props) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.duration(420).springify().damping(11)} style={styles.circleWrap}>
          <LinearGradient colors={gradients.mint} style={styles.circle}>
            <Animated.View entering={FadeIn.delay(180).duration(260)}>
              <Ionicons name="checkmark" size={wp(13)} color="#fff" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(260).duration(320)} style={styles.title}>{title}</Animated.Text>
        {!!subtitle && (
          <Animated.Text entering={FadeIn.delay(360).duration(320)} style={styles.subtitle}>{subtitle}</Animated.Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(20,18,40,0.92)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  circleWrap: {
    width: wp(28), height: wp(28), borderRadius: wp(14), marginBottom: spacing.lg,
    shadowColor: '#34C77B', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 16,
  },
  circle: { flex: 1, borderRadius: wp(14), alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: wp(5.6), fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: wp(3.6), color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: spacing.xs },
});
