// components/auth/PasswordMatchHint.tsx
// Live "passwords match / do not match" indicator shown beneath the
// confirm-password field as the user types. Purely visual feedback —
// the actual submit-time check stays in the screen that owns the state.

import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { wp } from '@/app/utils/responsive';
import { spacing } from '@/constants/theme';

export default function PasswordMatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;

  const matches = password === confirm;

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.row}>
      <Ionicons
        name={matches ? 'checkmark-circle' : 'close-circle'}
        size={wp(3.9)}
        color={matches ? '#2ECC71' : '#FF4D5A'}
      />
      <Text style={[styles.text, { color: matches ? '#1E9E5A' : '#E0303E' }]}>
        {matches ? 'Passwords match' : 'Passwords do not match'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: -spacing.sm + 2, marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  text: { fontSize: wp(3.1), fontWeight: '600' },
});
