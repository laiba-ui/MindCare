// app/privacy-security.tsx
import {
  StyleSheet, ScrollView, View, Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmModal';

function InfoRow({ icon, title, desc, color = '#6C63FF', last = false }: {
  icon: string; title: string; desc: string; color?: string; last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={wp(5)} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, danger = false, onPress, last = false }: {
  icon: string; label: string; danger?: boolean; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress} activeOpacity={0.75}
    >
      <Ionicons name={icon as any} size={wp(5)} color={danger ? '#FF4D5A' : '#6C63FF'} />
      <Text style={[styles.actionText, danger && { color: '#FF4D5A' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={wp(4.5)} color="#CCC" />
    </TouchableOpacity>
  );
}

export default function PrivacySecurity() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const confirm = useConfirm();

  const handleClearHistory = async () => {
    const ok = await confirm({
      title: 'Clear Mood History',
      message: 'This will delete all your mood logs permanently.',
      confirmLabel: 'Delete',
      danger: true,
      icon: 'trash',
    });
    if (ok) toast.info('Coming soon', 'Mood history deletion will be available in a future update.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Privacy & Security" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield banner */}
        <View style={styles.shieldBanner}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
          <Text style={styles.shieldTitle}>Your data is safe</Text>
          <Text style={styles.shieldSub}>
            MindSpace stores your data securely and never sells it to third parties.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>What we store</Text>
        <View style={styles.card}>
          <InfoRow icon="person-outline"       color="#6C63FF" title="Profile Info"   desc="Your name, email, university and study year." />
          <InfoRow icon="happy-outline"        color="#76C893" title="Mood Entries"   desc="Your daily mood logs and notes — stored locally on your device." />
          <InfoRow icon="chatbubble-outline"   color="#A78BFA" title="Chat History"   desc="Conversations with Maia are not stored permanently." />
          <InfoRow icon="alert-circle-outline" color="#FF8A80" title="Risk Alerts"    desc="If high-risk mood detected, an alert goes to your university counselor." last />
        </View>

        <Text style={styles.sectionLabel}>Your rights</Text>
        <View style={styles.card}>
          <InfoRow icon="eye-off-outline"       color="#6C63FF" title="Private by default"  desc="Only you can see your mood history and notes." />
          <InfoRow icon="lock-closed-outline"   color="#A78BFA" title="Password protected"  desc="Your account is secured with your password." />
          <InfoRow icon="phone-portrait-outline" color="#4FC3F7" title="Local storage"      desc="Mood data is stored on your device using AsyncStorage." last />
        </View>

        <Text style={styles.sectionLabel}>Data management</Text>
        <View style={styles.card}>
          <ActionRow
            icon="download-outline" label="Export My Data"
            onPress={() => toast.info('Export Data', 'Your mood history export is coming soon.')}
          />
          <ActionRow
            icon="trash-outline" label="Clear Mood History" danger last
            onPress={handleClearHistory}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={wp(4.5)} color="#6C63FF" />
          <Text style={styles.noteText}>
            This app is for educational and wellness support only. It does not provide medical diagnosis or professional therapy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },
  backBtn:     { padding: 4, marginRight: spacing.sm },
  headerTitle: { flex: 1, fontSize: wp(5), fontWeight: '700', color: '#fff', textAlign: 'center' },

  body: { padding: spacing.md },

  shieldBanner: {
    backgroundColor: '#EDE9FF', borderRadius: 20, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  shieldEmoji: { fontSize: wp(12), marginBottom: spacing.sm },
  shieldTitle: { fontSize: wp(5), fontWeight: '800', color: '#2D2B55', marginBottom: 4 },
  shieldSub:   { fontSize: wp(3.4), color: '#6B6A8A', textAlign: 'center', lineHeight: wp(5.2) },

  sectionLabel: {
    fontSize: wp(3.5), fontWeight: '700', color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: spacing.sm, marginTop: spacing.xs,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
    shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F4FF',
  },
  infoIcon:  { width: wp(9), height: wp(9), borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: wp(3.8), fontWeight: '600', color: '#2D2B55' },
  infoDesc:  { fontSize: wp(3.2), color: '#6B6A8A', marginTop: 2, lineHeight: wp(4.8) },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F4FF',
  },
  actionText: { flex: 1, fontSize: wp(3.9), fontWeight: '500', color: '#2D2B55' },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  noteText: { flex: 1, fontSize: wp(3.2), color: '#2D2B55', lineHeight: wp(5) },
});