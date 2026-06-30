// app/micro-goals.tsx
// Micro-Goals with PERSISTENT 24-hour completion tracking
//
// Storage strategy (dual-layer):
//  1. Primary  → backend  POST /goals/complete  + GET /goals/status
//  2. Fallback → AsyncStorage (works offline / if backend unavailable)
//
// Key behaviours:
//  • Completion survives navigation, app restarts, and re-logins
//  • State expires exactly 24 h after the completion timestamp
//  • Duplicate completions are ignored (idempotent)
//  • Timezone-safe: all comparisons done in UTC ms

import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { api } from './utils/api';

// ─── Goal pool ────────────────────────────────────────────────────────────────
const GOALS_POOL = [
  { id: '1',  icon: '🌬️', title: 'Box Breathing',      desc: 'Inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times.',  category: 'Calm',      duration: '2 min',  color: '#A1CFFF' },
  { id: '2',  icon: '😮‍💨', title: '4-7-8 Breathing',    desc: 'Inhale 4s, hold 7s, exhale slowly for 8s. Do 3 rounds.',      category: 'Calm',      duration: '3 min',  color: '#A1CFFF' },
  { id: '3',  icon: '🚶', title: '10-Min Walk',          desc: 'Step outside for a 10-minute walk. No phone allowed!',         category: 'Movement',  duration: '10 min', color: '#A8E6CF' },
  { id: '4',  icon: '🧘', title: 'Gentle Stretching',    desc: 'Stretch your neck, shoulders and back for 5 minutes.',         category: 'Movement',  duration: '5 min',  color: '#A8E6CF' },
  { id: '5',  icon: '💃', title: 'Dance It Out',          desc: 'Put on your favourite song and dance freely for 3 minutes.',   category: 'Movement',  duration: '3 min',  color: '#A8E6CF' },
  { id: '6',  icon: '📝', title: 'Gratitude Journal',    desc: 'Write 3 things you are grateful for today, big or small.',     category: 'Journal',   duration: '5 min',  color: '#FFCC80' },
  { id: '7',  icon: '💭', title: 'Thought Dump',          desc: 'Write freely for 5 minutes — anything on your mind.',          category: 'Journal',   duration: '5 min',  color: '#FFCC80' },
  { id: '8',  icon: '🌟', title: 'Win of the Day',        desc: 'Write one thing you did well today, however small.',           category: 'Journal',   duration: '2 min',  color: '#FFCC80' },
  { id: '9',  icon: '💬', title: 'Text a Friend',         desc: "Send a kind message to someone you haven't talked to lately.", category: 'Social',    duration: '2 min',  color: '#CE93D8' },
  { id: '10', icon: '😊', title: 'Compliment Someone',   desc: 'Give a genuine compliment to someone around you today.',       category: 'Social',    duration: '1 min',  color: '#CE93D8' },
  { id: '11', icon: '☕', title: 'Mindful Tea/Coffee',   desc: 'Make a warm drink. Sit quietly and focus only on the taste.',  category: 'Mindful',   duration: '5 min',  color: '#F48FB1' },
  { id: '12', icon: '🌿', title: '5-4-3-2-1 Grounding',  desc: '5 things you see, 4 hear, 3 touch, 2 smell, 1 taste.',         category: 'Mindful',   duration: '3 min',  color: '#F48FB1' },
  { id: '13', icon: '🎨', title: 'Doodle Freely',         desc: 'Draw or doodle anything for 5 minutes. No skill needed!',     category: 'Mindful',   duration: '5 min',  color: '#F48FB1' },
  { id: '14', icon: '💧', title: 'Hydration Check',      desc: 'Drink a full glass of water right now. Then another.',         category: 'Self-care', duration: '1 min',  color: '#76C893' },
  { id: '15', icon: '🛏️', title: 'Rest Your Eyes',       desc: 'Close your eyes and rest for 5 minutes. No screens.',          category: 'Self-care', duration: '5 min',  color: '#76C893' },
];

// Date-seeded shuffle — same 4 goals all day, refreshes at midnight
function getDailyGoals() {
  const d    = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return [...GOALS_POOL]
    .sort((a, b) => (((seed ^ +a.id) * 2654435761) >>> 0) - (((seed ^ +b.id) * 2654435761) >>> 0))
    .slice(0, 4);
}

// ─── Persistence helpers ──────────────────────────────────────────────────────
// Local storage key: per-day so we never mix data across days
const STORAGE_KEY = () => {
  const d = new Date();
  return `mindcare_goals_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
};

// Record shape stored locally: { goalId → completedAtMs }
type LocalRecord = Record<string, number>;

/** Returns true if completedAtMs is less than 24 h ago */
function isWithin24h(ts: number): boolean {
  return Date.now() - ts < 24 * 60 * 60 * 1000;
}

/** Load completion map from AsyncStorage; purge entries older than 24 h */
async function loadLocal(): Promise<LocalRecord> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY());
    if (!raw) return {};
    const parsed: LocalRecord = JSON.parse(raw);
    // Purge expired
    const valid: LocalRecord = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (isWithin24h(ts)) valid[id] = ts;
    }
    return valid;
  } catch {
    return {};
  }
}

/** Persist a single completion to AsyncStorage */
async function saveLocal(record: LocalRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY(), JSON.stringify(record));
  } catch {}
}

/** Try backend; return null on failure */
async function fetchBackendStatus(goalIds: string[]): Promise<LocalRecord | null> {
  try {
    const data = await api('/goals/status', 'POST', { goalIds }, true);
    if (!data?.completions) return null;
    // Backend returns [{ goalId, completedAt }]
    const map: LocalRecord = {};
    for (const c of data.completions) {
      if (isWithin24h(new Date(c.completedAt).getTime())) {
        map[c.goalId] = new Date(c.completedAt).getTime();
      }
    }
    return map;
  } catch {
    return null;
  }
}

async function postBackendComplete(goalId: string): Promise<void> {
  try {
    await api('/goals/complete', 'POST', { goalId }, true);
  } catch {}
}

// ─── "Resets in X h" helper ──────────────────────────────────────────────────
function resetsIn(ts: number): string {
  const remaining = 24 * 60 * 60 * 1000 - (Date.now() - ts);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  if (h > 0) return `Resets in ${h}h ${m}m`;
  return `Resets in ${m}m`;
}

// ─── Goal card ────────────────────────────────────────────────────────────────
function GoalCard({
  goal, completedAt, onToggle, enterDelay,
}: {
  goal: typeof GOALS_POOL[0];
  completedAt: number | null;
  onToggle: () => void;
  enterDelay: number;
}) {
  const done       = completedAt !== null;
  const cardScale  = useSharedValue(1);
  const checkScale = useSharedValue(done ? 1 : 0);
  const glowOp     = useSharedValue(0);

  // Entrance animation
  const enterOp = useSharedValue(0);
  const enterY  = useSharedValue(18);
  useEffect(() => {
    enterOp.value = withDelay(enterDelay, withTiming(1, { duration: 350 }));
    enterY.value  = withDelay(enterDelay, withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }));
  }, []);

  // Sync check animation when `done` changes
  useEffect(() => {
    if (done) {
      checkScale.value = withSpring(1, { damping: 7, stiffness: 160 });
      glowOp.value     = withSequence(
        withTiming(1,   { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 400 })),
      );
    } else {
      checkScale.value = withTiming(0, { duration: 180 });
      glowOp.value     = withTiming(0, { duration: 200 });
    }
  }, [done]);

  const press = () => {
    cardScale.value = withSequence(
      withTiming(0.97, { duration: 70 }),
      withSpring(1,    { damping: 18, stiffness: 200 }),
    );
    onToggle();
  };

  const cardStyle  = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glowOp.value }));
  const enterStyle = useAnimatedStyle(() => ({ opacity: enterOp.value, transform: [{ translateY: enterY.value }] }));

  return (
    <Animated.View style={enterStyle}>
      <Animated.View style={[cardStyle]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={press}
          style={[styles.goalCard, done && styles.goalCardDone]}
        >
          {/* Completion glow flash */}
          <Animated.View style={[styles.completionGlow, { backgroundColor: goal.color }, glowStyle]} />

          {/* Left accent */}
          <View style={[styles.goalAccent, { backgroundColor: done ? '#34C77B' : goal.color }]} />

          <View style={styles.goalBody}>
            {/* Top row */}
            <View style={styles.goalTop}>
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <View style={[styles.catBadge, { backgroundColor: goal.color + '40' }]}>
                <Text style={styles.catText}>{goal.category}</Text>
              </View>
              <View style={styles.durBadge}>
                <Ionicons name="time-outline" size={wp(3)} color="#999" />
                <Text style={styles.durText}>{goal.duration}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.goalTitle, done && styles.goalTitleDone]}>{goal.title}</Text>
            <Text style={styles.goalDesc}>{goal.desc}</Text>

            {/* Status row */}
            {done && completedAt && (
              <View style={styles.statusRow}>
                <View style={styles.completedBadge}>
                  <Animated.View style={checkStyle}>
                    <Ionicons name="checkmark-circle" size={wp(4)} color="#34C77B" />
                  </Animated.View>
                  <Text style={styles.completedText}>Completed today ✅</Text>
                </View>
                <Text style={styles.resetsText}>{resetsIn(completedAt)}</Text>
              </View>
            )}

            {/* Action button */}
            <TouchableOpacity
              style={[styles.doneBtn, done && styles.doneBtnActive]}
              onPress={press}
              activeOpacity={0.8}
            >
              <Animated.View style={checkStyle}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={wp(4.5)}
                  color={done ? '#fff' : '#6C63FF'}
                />
              </Animated.View>
              <Text style={[styles.doneBtnText, done && { color: '#fff' }]}>
                {done ? 'Completed!' : 'Mark complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(pct, { duration: 700, easing: Easing.out(Easing.ease) });
  }, [pct]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: pct === 100 ? '#34C77B' : '#6C63FF',
  }));
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MicroGoalsScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const toast      = useToast();
  const dailyGoals = getDailyGoals();

  // completions: goalId → timestamp (ms) of when it was completed
  const [completions, setCompletions] = useState<LocalRecord>({});
  const [loading, setLoading]         = useState(true);

  // ── Load persisted state whenever screen gains focus ──────────────────────
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      // 1. Load local first (instant, works offline)
      const local = await loadLocal();

      // 2. Try to sync with backend
      const goalIds = dailyGoals.map(g => g.id);
      const backend = await fetchBackendStatus(goalIds);

      // 3. Merge: backend wins on conflict (more authoritative)
      const merged: LocalRecord = { ...local };
      if (backend) {
        for (const [id, ts] of Object.entries(backend)) {
          merged[id] = ts;
        }
        // Persist merged result locally so offline works next time
        await saveLocal(merged);
      }

      if (!cancelled) {
        setCompletions(merged);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []));

  // ── Toggle a goal ─────────────────────────────────────────────────────────
  const toggle = async (id: string) => {
    const alreadyDone = !!completions[id] && isWithin24h(completions[id]);

    if (alreadyDone) {
      // Allow un-completing (remove from storage)
      const next = { ...completions };
      delete next[id];
      setCompletions(next);
      await saveLocal(next);
      return;
    }

    // Mark complete
    const ts   = Date.now();
    const next = { ...completions, [id]: ts };
    setCompletions(next);
    await saveLocal(next);

    // Fire-and-forget backend save
    postBackendComplete(id);

    // All done celebration
    const totalDone = Object.keys(next).filter(k =>
      dailyGoals.some(g => g.id === k) && isWithin24h(next[k])
    ).length;
    if (totalDone === dailyGoals.length) {
      setTimeout(() => toast.success('🎉 Amazing!', 'All wellness goals completed today!'), 350);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const doneIds = dailyGoals
    .map(g => g.id)
    .filter(id => completions[id] && isWithin24h(completions[id]));
  const doneCount = doneIds.length;
  const total     = dailyGoals.length;
  const pct       = Math.round((doneCount / total) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Micro-Goals" subtitle="Small steps, big change 🌱" onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress card */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Today's progress</Text>
            <Text style={styles.progressCount}>{doneCount}/{total} done · {pct}%</Text>
          </View>
          <ProgressBar pct={pct} />
          <Text style={styles.progressNote}>
            {pct === 100
              ? '🎉 All done! Come back tomorrow for new goals.'
              : `${total - doneCount} task${total - doneCount === 1 ? '' : 's'} remaining — you've got this!`}
          </Text>
        </Animated.View>

        {/* Info banner */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={wp(4.5)} color="#6C63FF" />
          <Text style={styles.infoText}>
            Completions are saved for 24 hours. Goals refresh daily at midnight. Based on CBT Behavioral Activation.
          </Text>
        </Animated.View>

        {/* Goals */}
        <Text style={styles.sectionTitle}>Today's Goals</Text>
        {loading ? (
          // Skeleton placeholders
          [0,1,2,3].map(i => (
            <View key={i} style={[styles.goalCard, { minHeight: 120, opacity: 0.4 }]}>
              <View style={[styles.goalAccent, { backgroundColor: '#C4B5FD' }]} />
              <View style={{ flex: 1, padding: spacing.md, gap: 10 }}>
                <View style={{ width: '60%', height: 14, backgroundColor: '#E0DEFF', borderRadius: 7 }} />
                <View style={{ width: '90%', height: 10, backgroundColor: '#E0DEFF', borderRadius: 5 }} />
                <View style={{ width: '40%', height: 10, backgroundColor: '#E0DEFF', borderRadius: 5 }} />
              </View>
            </View>
          ))
        ) : (
          dailyGoals.map((g, i) => (
            <GoalCard
              key={g.id}
              goal={g}
              completedAt={completions[g.id] && isWithin24h(completions[g.id]) ? completions[g.id] : null}
              onToggle={() => toggle(g.id)}
              enterDelay={i * 80}
            />
          ))
        )}

        {/* Quote */}
        <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "You don't have to be great to start, but you have to start to be great."
          </Text>
          <Text style={styles.quoteAuthor}>— Zig Ziglar</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  body: { padding: spacing.md },

  // Progress card
  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#6C63FF', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  progressTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle:{ fontSize: wp(3.8), fontWeight: '700', color: '#2D2B55' },
  progressCount:{ fontSize: wp(3.5), color: '#6C63FF', fontWeight: '700' },
  progressTrack:{ height: 10, borderRadius: 6, backgroundColor: '#F0EEFF', overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 6 },
  progressNote: { fontSize: wp(3.2), color: '#6B6A8A' },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#C4B5FD',
  },
  infoText: { flex: 1, fontSize: wp(3.2), color: '#2D2B55', lineHeight: wp(5) },

  sectionTitle: { fontSize: wp(4), fontWeight: '700', color: '#2D2B55', marginBottom: spacing.sm },

  // Goal card
  goalCard: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: spacing.md,
    flexDirection: 'row', overflow: 'hidden', position: 'relative',
    shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  goalCardDone:    { backgroundColor: '#F4FFF8' },
  completionGlow:  { position: 'absolute', inset: 0, borderRadius: 20, opacity: 0 },
  goalAccent:      { width: 5 },
  goalBody:        { flex: 1, padding: spacing.md },

  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  goalIcon:{ fontSize: wp(6) },
  catBadge:{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  catText: { fontSize: wp(2.8), fontWeight: '600', color: '#2D2B55' },
  durBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  durText: { fontSize: wp(2.8), color: '#999' },

  goalTitle:     { fontSize: wp(4.2), fontWeight: '700', color: '#2D2B55', marginBottom: 4 },
  goalTitleDone: { textDecorationLine: 'line-through', color: '#AAA' },
  goalDesc:      { fontSize: wp(3.4), color: '#6B6A8A', lineHeight: wp(5.2), marginBottom: spacing.sm },

  // Persistent status row
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EDFFF4', borderRadius: 10, padding: spacing.sm,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: '#B8F0D2',
  },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  completedText:  { fontSize: wp(3.1), color: '#1A8A4A', fontWeight: '700' },
  resetsText:     { fontSize: wp(2.8), color: '#6B6A8A', fontWeight: '600' },

  // Done button
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: spacing.md,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#6C63FF',
  },
  doneBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  doneBtnText:   { fontSize: wp(3.3), color: '#6C63FF', fontWeight: '600' },

  // Quote
  quoteCard: {
    backgroundColor: '#EDE9FF', borderRadius: 16, padding: spacing.md,
    borderLeftWidth: 4, borderLeftColor: '#6C63FF',
  },
  quoteText:   { fontSize: wp(3.5), color: '#2D2B55', fontStyle: 'italic', lineHeight: wp(5.5) },
  quoteAuthor: { fontSize: wp(3.2), color: '#6C63FF', fontWeight: '600', marginTop: 6 },
});
