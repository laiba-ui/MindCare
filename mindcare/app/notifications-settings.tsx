// app/notifications-settings.tsx
import { useState } from 'react';
import {
  StyleSheet, ScrollView, View, Text,
  Switch, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';
import { useToast } from '@/components/ui/ToastProvider';

function ToggleRow({ icon, color, title, subtitle, value, onChange }: {
  icon: string; color: string; title: string;
  subtitle: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={wp(5)} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E0E0E0', true: '#A78BFA' }}
        thumbColor={value ? '#6C63FF' : '#f4f3f4'}
      />
    </View>
  );
}

export default function NotificationsSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [dailyReminder,  setDailyReminder]  = useState(true);
  const [streakAlert,    setStreakAlert]    = useState(true);
  const [weeklyReport,   setWeeklyReport]   = useState(false);
  const [goalReminder,   setGoalReminder]   = useState(true);
  const [counselorAlert, setCounselorAlert] = useState(true);
  const [tipOfDay,       setTipOfDay]       = useState(true);

  const handleSave = () => {
    toast.success('Saved ✅', 'Your notification preferences have been updated.');
    setTimeout(() => router.back(), 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader
        title="Notifications"
        onBack={() => router.back()}
        right={(
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        )}
      />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={wp(5)} color="#6C63FF" />
          <Text style={styles.infoText}>
            Control which notifications you receive from MindSpace.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Daily Wellness</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="sunny-outline" color="#FFB347"
            title="Daily Mood Reminder" subtitle="Remind me to log my mood each day"
            value={dailyReminder} onChange={setDailyReminder}
          />
          <ToggleRow
            icon="bulb-outline" color="#76C893"
            title="Tip of the Day" subtitle="Receive a daily wellness tip"
            value={tipOfDay} onChange={setTipOfDay}
          />
          <ToggleRow
            icon="ribbon-outline" color="#FFD700"
            title="Goal Reminder" subtitle="Remind me to complete my micro-goals"
            value={goalReminder} onChange={setGoalReminder}
          />
        </View>

        <Text style={styles.sectionLabel}>Progress & Streaks</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="flame-outline" color="#FF8A80"
            title="Streak Alert" subtitle="Alert when my streak is about to break"
            value={streakAlert} onChange={setStreakAlert}
          />
          <ToggleRow
            icon="bar-chart-outline" color="#6C63FF"
            title="Weekly Mood Report" subtitle="Summary of my mood every Sunday"
            value={weeklyReport} onChange={setWeeklyReport}
          />
        </View>

        <Text style={styles.sectionLabel}>Safety</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="alert-circle-outline" color="#FF4D5A"
            title="Counselor Alert" subtitle="Notify when high-risk mood is detected"
            value={counselorAlert} onChange={setCounselorAlert}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={wp(4.5)} color="#6C63FF" />
          <Text style={styles.noteText}>
            Counselor alerts are only triggered for your safety and are handled confidentially.
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
  saveBtn:     { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: wp(3.8) },

  body: { padding: spacing.md },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: '#C4B5FD',
  },
  infoText: { flex: 1, fontSize: wp(3.3), color: '#2D2B55' },

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
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F4FF',
  },
  toggleIcon:  { width: wp(9), height: wp(9), borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontSize: wp(3.8), fontWeight: '600', color: '#2D2B55' },
  toggleSub:   { fontSize: wp(3), color: '#AAA', marginTop: 2 },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  noteText: { flex: 1, fontSize: wp(3.2), color: '#2D2B55', lineHeight: wp(5) },
});