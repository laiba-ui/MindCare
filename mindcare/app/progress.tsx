// app/progress.tsx
// Proper line/area chart using React Native SVG-style drawing
// Monthly view shows every day of the month (not just 4 week averages)

import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import { api } from './utils/api';
import GradientHeader from '@/components/ui/GradientHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import Svg, { Path, Circle, Line, Text as SvgText, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const CHART_W = wp(82);
const CHART_H = hp(22);

function moodColor(score: number) {
  if (score >= 4) return '#76C893';
  if (score === 3) return '#A1CFFF';
  if (score === 2) return '#FFCC80';
  if (score >= 1) return '#FF8A80';
  return '#E0E0E0';
}

// Build last 7 days
function buildWeeklyData(moods: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const hit = moods.find((m: any) => m.dateKey === key);
    return { label: days[d.getDay()], score: hit?.score ?? 0, emoji: hit?.emoji ?? '', empty: !hit };
  });
}

// Build last 30 days (every single day)
function buildMonthlyData(moods: any[]) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const hit = moods.find((m: any) => m.dateKey === key);
    // Show date label every 5 days
    const showLabel = (i === 0 || i === 9 || i === 19 || i === 29 || i % 10 === 4);
    const label = showLabel ? `${d.getMonth() + 1}/${d.getDate()}` : '';
    return { label, score: hit?.score ?? 0, emoji: hit?.emoji ?? '', empty: !hit, dayIndex: i };
  });
}

// ── Proper Line Chart Component ───────────────────────────────────────────────
function LineChart({ data }: {
  data: { label: string; score: number; emoji?: string; empty?: boolean }[];
}) {
  const padL = 28;
  const padR = 10;
  const padT = 16;
  const padB = 36;
  const w    = CHART_W - padL - padR;
  const h    = CHART_H - padT - padB;
  const n    = data.length;

  // Points with score > 0
  const points = data.map((d, i) => ({
    x: padL + (i / (n - 1)) * w,
    y: d.score > 0 ? padT + (1 - (d.score - 1) / 4) * h : -1,
    score: d.score,
    label: d.label,
    emoji: d.emoji,
    empty: d.empty,
  }));

  // Build smooth path through valid points only
  const validPts = points.filter(p => p.y >= 0);

  const buildPath = () => {
    if (validPts.length < 2) return '';
    let d = `M ${validPts[0].x} ${validPts[0].y}`;
    for (let i = 1; i < validPts.length; i++) {
      const prev = validPts[i - 1];
      const curr = validPts[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
      d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildAreaPath = () => {
    const linePath = buildPath();
    if (!linePath) return '';
    const bottom = padT + h;
    return `${linePath} L ${validPts[validPts.length - 1].x} ${bottom} L ${validPts[0].x} ${bottom} Z`;
  };

  const yLabels = [5, 4, 3, 2, 1];

  return (
    <Svg width={CHART_W} height={CHART_H + 4}>
      <Defs>
        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6C63FF" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#6C63FF" stopOpacity="0.02" />
        </SvgGradient>
      </Defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = padT + (i / 4) * h;
        return (
          <Line
            key={v}
            x1={padL} y1={y} x2={padL + w} y2={y}
            stroke="#EBEBF5" strokeWidth="1"
            strokeDasharray={i === 0 ? '0' : '4,3'}
          />
        );
      })}

      {/* Y-axis labels */}
      {yLabels.map((v, i) => {
        const y = padT + (i / 4) * h;
        return (
          <SvgText key={v} x={padL - 6} y={y + 4} fontSize="9" fill="#AAA" textAnchor="end">{v}</SvgText>
        );
      })}

      {/* Area fill */}
      {validPts.length >= 2 && (
        <Path d={buildAreaPath()} fill="url(#areaGrad)" />
      )}

      {/* Line */}
      {validPts.length >= 2 && (
        <Path d={buildPath()} fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Data points */}
      {validPts.map((p, i) => (
        <Circle
          key={i}
          cx={p.x} cy={p.y} r={4}
          fill={moodColor(p.score)}
          stroke="#fff" strokeWidth="2"
        />
      ))}

      {/* X-axis labels — only show labels that are non-empty */}
      {points.map((p, i) => {
        if (!data[i].label) return null;
        return (
          <SvgText
            key={i}
            x={p.x} y={CHART_H - 2}
            fontSize={n > 10 ? '7.5' : '9'}
            fill="#888"
            textAnchor="middle"
          >
            {data[i].label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ── Mini Line Chart for Home Page ─────────────────────────────────────────────
export function MiniWeeklyChart({ moods }: { moods: any[] }) {
  const data = buildWeeklyData(moods);
  const padL = 6; const padR = 6; const padT = 8; const padB = 20;
  const chartW = wp(88);
  const chartH = hp(12);
  const w = chartW - padL - padR;
  const h = chartH - padT - padB;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padL + (i / (n - 1)) * w,
    y: d.score > 0 ? padT + (1 - (d.score - 1) / 4) * h : -1,
    score: d.score,
    label: d.label,
  }));

  const validPts = points.filter(p => p.y >= 0);

  const buildPath = () => {
    if (validPts.length < 2) return '';
    let d = `M ${validPts[0].x} ${validPts[0].y}`;
    for (let i = 1; i < validPts.length; i++) {
      const prev = validPts[i - 1];
      const curr = validPts[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
      d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildAreaPath = () => {
    const linePath = buildPath();
    if (!linePath) return '';
    const bottom = padT + h;
    return `${linePath} L ${validPts[validPts.length - 1].x} ${bottom} L ${validPts[0].x} ${bottom} Z`;
  };

  if (moods.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <Text style={{ color: '#AAA', fontSize: wp(3.3) }}>No mood data yet — start logging daily!</Text>
      </View>
    );
  }

  return (
    <Svg width={chartW} height={chartH + 4}>
      <Defs>
        <SvgGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6C63FF" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#6C63FF" stopOpacity="0.02" />
        </SvgGradient>
      </Defs>

      {validPts.length >= 2 && (
        <Path d={buildAreaPath()} fill="url(#miniGrad)" />
      )}
      {validPts.length >= 2 && (
        <Path d={buildPath()} fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" />
      )}
      {validPts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={moodColor(p.score)} stroke="#fff" strokeWidth="1.5" />
      ))}
      {points.map((p, i) => (
        <SvgText key={i} x={p.x} y={chartH} fontSize="9" fill="#888" textAnchor="middle">{p.label}</SvgText>
      ))}
    </Svg>
  );
}

// ── Main Progress Screen ──────────────────────────────────────────────────────
export default function ProgressScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [view,    setView]    = useState<'weekly' | 'monthly'>('weekly');
  const [moods,   setMoods]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/mood/history', 'GET', undefined, true);
        setMoods(data.moods || []);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const weeklyData  = buildWeeklyData(moods);
  const monthlyData = buildMonthlyData(moods);

  const scoredDays = weeklyData.filter(d => d.score > 0);
  const avgScore   = scoredDays.length
    ? (scoredDays.reduce((s, d) => s + d.score, 0) / scoredDays.length).toFixed(1)
    : '—';
  const bestDay    = scoredDays.length ? scoredDays.reduce((a, b) => a.score > b.score ? a : b) : null;
  const lowestDay  = scoredDays.length ? scoredDays.reduce((a, b) => a.score < b.score ? a : b) : null;
  const loggedDays = moods.length;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F6FF' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="My Progress" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(380)} style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: '#6C63FF' }]}>
            <Ionicons name="stats-chart-outline" size={wp(5.5)} color="#6C63FF" />
            <Text style={styles.statValue}>{avgScore}</Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#76C893' }]}>
            <Text style={styles.statEmoji}>{bestDay?.emoji || '—'}</Text>
            <Text style={styles.statValue}>{bestDay?.label || '—'}</Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#FF8A80' }]}>
            <Text style={styles.statEmoji}>{lowestDay?.emoji || '—'}</Text>
            <Text style={styles.statValue}>{lowestDay?.label || '—'}</Text>
            <Text style={styles.statLabel}>Lowest</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#FFD700' }]}>
            <Ionicons name="journal-outline" size={wp(5.5)} color="#FFD700" />
            <AnimatedCounter value={loggedDays} style={styles.statValue} />
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </Animated.View>

        {/* Chart card */}
        <Animated.View entering={FadeInDown.delay(70).duration(400)} style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Emotional Trend 🌈</Text>
          </View>
          <SegmentedControl
            segments={[{ key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }]}
            value={view}
            onChange={(k) => setView(k as 'weekly' | 'monthly')}
          />
          <Text style={[styles.cardSub, { marginTop: spacing.sm }]}>
            {view === 'weekly' ? 'Your last 7 days' : 'Last 30 days — every day'}
          </Text>

          {moods.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>No mood data yet. Start logging daily!</Text>
            </View>
          ) : (
            <ScrollView horizontal={view === 'monthly'} showsHorizontalScrollIndicator={false}>
              <View style={{ paddingBottom: spacing.xs }}>
                <LineChart data={view === 'weekly' ? weeklyData : monthlyData} />
              </View>
            </ScrollView>
          )}

          <View style={styles.legend}>
            {([['#76C893','Great (4-5)'],['#A1CFFF','Okay (3)'],['#FFCC80','Low (2)'],['#FF8A80','Rough (1)']] as [string,string][]).map(([c,l]) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={styles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Insight */}
        {moods.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>This Week's Insight</Text>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>
                  {scoredDays.length > 0
                    ? (() => {
                        const counts: Record<string, number> = {};
                        moods.slice(0, 7).forEach((m: any) => { counts[m.emoji] = (counts[m.emoji] || 0) + 1; });
                        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '😊';
                      })()
                    : '—'}
                </Text>
                <Text style={styles.insightLabel}>Most frequent</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>
                  {scoredDays.length >= 2
                    ? (scoredDays[scoredDays.length - 1].score >= scoredDays[0].score ? '📈' : '📉')
                    : '📊'}
                </Text>
                <Text style={styles.insightLabel}>Trend</Text>
                <Text style={[styles.insightValue, {
                  color: scoredDays.length >= 2 && scoredDays[scoredDays.length-1].score >= scoredDays[0].score
                    ? '#76C893' : '#FF8A80',
                }]}>
                  {scoredDays.length >= 2
                    ? (scoredDays[scoredDays.length-1].score >= scoredDays[0].score ? 'Improving' : 'Declining')
                    : 'Not enough data'}
                </Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>📅</Text>
                <Text style={styles.insightLabel}>This week</Text>
                <Text style={styles.insightValue}>{scoredDays.length}/7 days</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent log */}
        {moods.length > 0 && (
          <Animated.View entering={FadeInDown.delay(210).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>Recent Mood Log</Text>
            {moods.slice(0, 7).map((m: any, i: number) => (
              <View key={i} style={[styles.logRow, i === Math.min(moods.length, 7) - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.logDot, { backgroundColor: m.color || '#6C63FF' }]} />
                <Text style={styles.logEmoji}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.logTop}>
                    <Text style={styles.logLabel}>{m.label}</Text>
                    <Text style={styles.logDate}>
                      {new Date(m.loggedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  {!!m.note && <Text style={styles.logNote} numberOfLines={1}>"{m.note}"</Text>}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <TouchableOpacity onPress={() => router.push('/micro-goals' as any)} activeOpacity={0.85}>
            <LinearGradient colors={['#A78BFA', '#6C63FF']} style={styles.ctaCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Boost your mood today 🌱</Text>
                <Text style={styles.ctaSub}>Complete your daily micro-goals</Text>
              </View>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={wp(5)} color="#6C63FF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontSize: wp(5.5), fontWeight: '800', color: '#fff', textAlign: 'center' },
  body:        { padding: spacing.md },
  statsRow:    { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: spacing.sm, alignItems: 'center', borderTopWidth: 3, shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2, gap: 2 },
  statValue:   { fontSize: wp(4), fontWeight: '800', color: '#2D2B55' },
  statLabel:   { fontSize: wp(2.5), color: '#AAA', textAlign: 'center' },
  statEmoji:   { fontSize: wp(5.5) },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTitle:   { fontSize: wp(4.2), fontWeight: '700', color: '#2D2B55' },
  cardSub:     { fontSize: wp(3.2), color: '#AAA', marginBottom: spacing.md, marginTop: 2 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  toggle:      { flexDirection: 'row', backgroundColor: '#F0EEFF', borderRadius: 20, padding: 3 },
  toggleBtn:   { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: '#6C63FF' },
  toggleText:      { fontSize: wp(3), color: '#6C63FF', fontWeight: '600' },
  toggleTextActive:{ color: '#fff' },
  emptyChart:  { alignItems: 'center', paddingVertical: spacing.xl },
  emptyEmoji:  { fontSize: wp(10), marginBottom: spacing.sm },
  emptyText:   { fontSize: wp(3.5), color: '#AAA', textAlign: 'center' },
  legend:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { fontSize: wp(2.8), color: '#666' },
  insightRow:  { flexDirection: 'row', marginTop: spacing.sm },
  insightItem: { flex: 1, alignItems: 'center', gap: 4 },
  insightDivider: { width: 1, backgroundColor: '#F0EEFF', marginHorizontal: spacing.xs },
  insightEmoji:{ fontSize: wp(7) },
  insightLabel:{ fontSize: wp(2.8), color: '#AAA' },
  insightValue:{ fontSize: wp(3.5), fontWeight: '700', color: '#2D2B55', textAlign: 'center' },
  logRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: '#F5F4FF' },
  logDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  logEmoji:    { fontSize: wp(6), flexShrink: 0 },
  logTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logLabel:    { fontSize: wp(3.8), fontWeight: '600', color: '#2D2B55' },
  logDate:     { fontSize: wp(2.8), color: '#AAA' },
  logNote:     { fontSize: wp(3.2), color: '#6B6A8A', fontStyle: 'italic', marginTop: 2 },
  ctaCard:     { borderRadius: 20, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  ctaTitle:    { fontSize: wp(4.2), fontWeight: '700', color: '#fff' },
  ctaSub:      { fontSize: wp(3.3), color: 'rgba(255,255,255,0.82)', marginTop: 3 },
  ctaArrow:    { backgroundColor: '#fff', width: wp(10), height: wp(10), borderRadius: wp(5), alignItems: 'center', justifyContent: 'center' },
});
