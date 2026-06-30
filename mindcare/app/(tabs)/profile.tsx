// app/(tabs)/profile.tsx
// Shows cached user data instantly (no flash), refreshes from DB in background

import { useState, useCallback } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity,
  View, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import { api, clearAuth, getUser } from '../utils/api';
import { useConfirm } from '@/components/ui/ConfirmModal';

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={wp(6)} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, color = '#6C63FF', onPress, danger, last }: {
  icon: string; label: string; color?: string;
  onPress?: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: (danger ? '#FF4D5A' : color) + '18' }]}>
        <Ionicons name={icon as any} size={wp(5)} color={danger ? '#FF4D5A' : color} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#FF4D5A' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={wp(4.5)} color="#CCC" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();

  // ✅ Start with cached user from memory — no loading flash
  const cached = getUser();
  const [user,       setUser]       = useState<any>(cached);
  const [moodCount,  setMoodCount]  = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // ✅ Fetch silently in background — screen already shows cached data
      const refresh = async () => {
        try {
          const [profileRes, historyRes] = await Promise.all([
            api('/profile/me',   'GET', undefined, true),
            api('/mood/history', 'GET', undefined, true),
          ]);
          if (!cancelled) {
            setUser(profileRes.user);
            setMoodCount(historyRes.moods?.length || 0);
          }
        } catch {
          // Token expired → logout
          if (!cancelled) {
            await clearAuth();
            router.replace('/(auth)/login' as any);
          }
        }
      };
      refresh();
      return () => { cancelled = true; };
    }, [])
  );

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: "You'll need to sign in again to access your account.",
      confirmLabel: 'Log Out',
      danger: true,
      icon: 'log-out-outline',
    });
    if (!ok) return;
    await clearAuth();
    router.replace('/(auth)/login' as any);
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#6C63FF', '#A78BFA']}
          style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
        >
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile-settings' as any)}>
            <Ionicons name="create-outline" size={wp(5.5)} color="#fff" />
          </TouchableOpacity>
          <Animated.View entering={FadeInDown.duration(420)} style={{ alignItems: 'center' }}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{user?.avatar || '🧕'}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || '—'}</Text>
            <Text style={styles.userUni}>{user?.university || '—'}</Text>
            <Text style={styles.userYear}>{user?.year || ''}</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {user?.streak || 0} day streak</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.statsRow}>
          <StatCard icon="flame-outline"   label="Day Streak" value={`${user?.streak || 0}d`} color="#FF8A80" />
          <StatCard icon="journal-outline" label="Mood Logs"  value={`${moodCount}`}          color="#6C63FF" />
          <StatCard icon="happy-outline"   label="Avg Mood"   value="😊"                      color="#76C893" />
        </Animated.View>

        <View style={styles.joinedRow}>
          <Ionicons name="calendar-outline" size={wp(4)} color="#AAA" />
          <Text style={styles.joinedText}> Member since {joinDate}</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(140).duration(380)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuRow icon="person-outline"        label="Edit Profile"       onPress={() => router.push('/profile-settings' as any)} />
          <MenuRow icon="notifications-outline" label="Notifications"      color="#FFB347" onPress={() => router.push('/notifications-settings' as any)} />
          <MenuRow icon="lock-closed-outline"   label="Privacy & Security" color="#A78BFA" onPress={() => router.push('/privacy-security' as any)} />
          <MenuRow icon="language-outline"      label="Language"           color="#4FC3F7" onPress={() => router.push('/language-settings' as any)} />
          <MenuRow icon="server-outline"        label="Server Settings"    color="#FF8A80" onPress={() => router.push('/server-settings' as any)} last />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(380)} style={styles.section}>
          <Text style={styles.sectionTitle}>Wellness</Text>
          <MenuRow icon="bar-chart-outline" label="My Mood History"    color="#76C893" onPress={() => router.push('/progress' as any)} />
          <MenuRow icon="analytics-outline" label="Insights & Reports" color="#6C63FF" onPress={() => router.push('/progress' as any)} />
          <MenuRow icon="ribbon-outline"    label="Achievements"       color="#FFD700" onPress={() => router.push('/achievements' as any)} last />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(380)} style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuRow icon="help-circle-outline"        label="Help Center"      color="#4FC3F7" onPress={() => router.push('/help-center' as any)} />
          <MenuRow icon="chatbubble-outline"          label="Send Feedback"    color="#A78BFA" onPress={() => router.push('/send-feedback' as any)} />
          <MenuRow icon="information-circle-outline"  label="About MindSpace" color="#888"    onPress={() => router.push('/about' as any)} last />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(380)} style={[styles.section, { marginBottom: spacing.xl }]}>
          <MenuRow icon="log-out-outline" label="Log Out" danger onPress={handleLogout} last />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { alignItems: 'center', paddingBottom: hp(4), paddingHorizontal: spacing.lg },
  editBtn:     { position: 'absolute', top: hp(6), right: spacing.lg, padding: 4 },
  avatarRing:  { width: wp(28), height: wp(28), borderRadius: wp(14), borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarCircle:{ width: wp(24), height: wp(24), borderRadius: wp(12), backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: wp(13) },
  userName:    { fontSize: wp(6), fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  userUni:     { fontSize: wp(3.5), color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  userYear:    { fontSize: wp(3.2), color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  streakBadge: { marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20 },
  streakText:  { fontSize: wp(3.5), color: '#fff', fontWeight: '600' },
  statsRow:    { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: -hp(3), marginBottom: spacing.md, gap: spacing.sm },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: spacing.md, alignItems: 'center', borderTopWidth: 3, shadowColor: '#6C63FF', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, gap: 4 },
  statValue:   { fontSize: wp(5), fontWeight: '800', color: '#2D2B55' },
  statLabel:   { fontSize: wp(2.8), color: '#AAA', textAlign: 'center' },
  joinedRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  joinedText:  { fontSize: wp(3.2), color: '#AAA' },
  section:     { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, shadowColor: '#6C63FF', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle:{ fontSize: wp(3.5), fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, paddingVertical: spacing.sm },
  menuRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: '#F5F4FF', gap: spacing.sm },
  menuIcon:    { width: wp(9), height: wp(9), borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { flex: 1, fontSize: wp(3.9), color: '#2D2B55', fontWeight: '500' },
});