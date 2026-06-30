import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';
import { api } from './utils/api';

const getBadges = (streak: number, totalMoods: number, chatCount: number) => [
  { emoji: '🌱', title: 'First Step',      desc: 'Logged your first mood',           earned: totalMoods >= 1,  color: '#76C893' },
  { emoji: '🔥', title: '7-Day Streak',    desc: 'Logged mood 7 days in a row',      earned: streak >= 7,      color: '#FF8A80' },
  { emoji: '💬', title: 'First Chat',      desc: 'Had your first chat with Maia',    earned: chatCount >= 1,   color: '#A78BFA' },
  { emoji: '🎯', title: 'Mood Logger',     desc: 'Logged mood 5 times',              earned: totalMoods >= 5,  color: '#FFD700' },
  { emoji: '📊', title: 'Trend Watcher',   desc: 'Logged mood 10 times',             earned: totalMoods >= 10, color: '#4FC3F7' },
  { emoji: '🔥', title: '30-Day Streak',   desc: 'Log mood 30 days in a row',        earned: streak >= 30,     color: '#FF8A80' },
  { emoji: '🧠', title: 'Mindful Master',  desc: 'Logged mood 20 times',             earned: totalMoods >= 20, color: '#CE93D8' },
  { emoji: '💯', title: 'Perfect Month',   desc: 'Log mood every day for a month',   earned: totalMoods >= 30, color: '#76C893' },
  { emoji: '🌈', title: 'Mood Explorer',   desc: 'Log mood 15 times',                earned: totalMoods >= 15, color: '#A1CFFF' },
  { emoji: '🏆', title: 'Wellness Champ',  desc: 'Achieve a 14-day streak',          earned: streak >= 14,     color: '#FFD700' },
];

function BadgeCard({ badge, delay = 0 }: { badge: any; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360)} style={[styles.badge, !badge.earned && styles.badgeLocked]}>
      <View style={[styles.badgeCircle, { backgroundColor: badge.color + (badge.earned ? '25' : '10') }]}>
        <Text style={[styles.badgeEmoji, !badge.earned && { opacity: 0.3 }]}>{badge.emoji}</Text>
        {!badge.earned && (
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={wp(3.5)} color="#AAA" />
          </View>
        )}
      </View>
      <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTitleLocked]}>{badge.title}</Text>
      <Text style={styles.badgeDesc}>{badge.desc}</Text>
      {badge.earned && (
        <View style={[styles.earnedBadge, { backgroundColor: badge.color + '20' }]}>
          <Text style={[styles.earnedText, { color: badge.color === '#FFD700' ? '#B8860B' : badge.color }]}>
            Earned ✓
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function Achievements() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [streak,     setStreak]     = useState(0);
  const [totalMoods, setTotalMoods] = useState(0);
  const [chatCount,  setChatCount]  = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, historyData, chatData] = await Promise.all([
          api('/profile/me',   'GET', undefined, true),
          api('/mood/history', 'GET', undefined, true),
          api('/chat/history', 'GET', undefined, true),
        ]);
        setStreak(profileData.user?.streak || 0);
        setTotalMoods(historyData.moods?.length || 0);
        const userMessages = chatData.messages?.filter((m: any) => m.sender === 'user') || [];
        setChatCount(userMessages.length);
      } catch (err) {
        console.log('Achievements load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const BADGES  = getBadges(streak, totalMoods, chatCount);
  const earned  = BADGES.filter(b => b.earned).length;
  const total   = BADGES.length;
  const pct     = Math.round((earned / total) * 100);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F6FF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Achievements" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>🏅</Text>
          <Text style={styles.summaryTitle}>{earned} of {total} earned</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.summaryNote}>
            {streak > 0 ? `🔥 ${streak} day streak! ` : ''}Keep logging daily to unlock more badges!
          </Text>
        </Animated.View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLbl}>Day Streak 🔥</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalMoods}</Text>
            <Text style={styles.statLbl}>Moods Logged 📊</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{chatCount}</Text>
            <Text style={styles.statLbl}>Chats Sent 💬</Text>
          </View>
        </View>

        {/* Earned */}
        <Text style={styles.sectionLabel}>Earned 🌟</Text>
        <View style={styles.grid}>
          {BADGES.filter(b => b.earned).map((b, i) => (
            <BadgeCard key={b.title} badge={b} delay={60 + i * 50} />
          ))}
          {BADGES.filter(b => b.earned).length === 0 && (
            <Text style={{ color: '#AAA', padding: spacing.md, fontSize: wp(3.5) }}>
              Log your first mood to earn badges! 🌱
            </Text>
          )}
        </View>

        {/* Locked */}
        <Text style={styles.sectionLabel}>Locked 🔒</Text>
        <View style={styles.grid}>
          {BADGES.filter(b => !b.earned).map((b, i) => (
            <BadgeCard key={b.title} badge={b} delay={60 + i * 50} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.md,
    shadowColor: '#6C63FF', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  summaryEmoji:  { fontSize: wp(12), marginBottom: spacing.sm },
  summaryTitle:  { fontSize: wp(5), fontWeight: '800', color: '#2D2B55', marginBottom: spacing.md },
  progressTrack: { width: '100%', height: 10, backgroundColor: '#F0EEFF', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill:  { height: '100%', backgroundColor: '#6C63FF', borderRadius: 6 },
  summaryNote:   { fontSize: wp(3.3), color: '#6B6A8A', textAlign: 'center' },
  statsRow:      { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statBox:       { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, alignItems: 'center', shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNum:       { fontSize: wp(6), fontWeight: '900', color: '#6C63FF' },
  statLbl:       { fontSize: wp(2.8), color: '#6B6A8A', fontWeight: '600', textAlign: 'center', marginTop: 2 },
  sectionLabel:  { fontSize: wp(4), fontWeight: '700', color: '#2D2B55', marginBottom: spacing.sm, marginTop: spacing.xs },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  badge:         { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: spacing.md, alignItems: 'center', gap: 6, shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  badgeLocked:   { backgroundColor: '#F8F8F8' },
  badgeCircle:   { width: wp(16), height: wp(16), borderRadius: wp(8), alignItems: 'center', justifyContent: 'center' },
  badgeEmoji:    { fontSize: wp(8) },
  lockIcon:      { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 20, padding: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  badgeTitle:       { fontSize: wp(3.5), fontWeight: '700', color: '#2D2B55', textAlign: 'center' },
  badgeTitleLocked: { color: '#AAA' },
  badgeDesc:        { fontSize: wp(2.9), color: '#6B6A8A', textAlign: 'center', lineHeight: wp(4.5) },
  earnedBadge:   { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 20, marginTop: 2 },
  earnedText:    { fontSize: wp(2.8), fontWeight: '700' },
});