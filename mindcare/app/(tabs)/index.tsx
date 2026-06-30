// app/(tabs)/index.tsx — MindCare Premium Dashboard v5
// Pixel-perfect match to reference images:
// • Image 3: Deep purple bg, 3D emoji on cloud, realistic flame badge, 3 glow stat cards
// • Image 2: 4 Quick Action cards in ONE row with 3D illustrations + sparkles
// • Ember particles on flame, floating sparkles on mood mascot, count-up numbers

import {
  Platform, Pressable, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing, FadeInDown,
  useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle, Defs, Line, LinearGradient as SvgGrad,
  Path, Stop, Text as SvgText,
} from 'react-native-svg';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/Skeleton';
import { spacing } from '@/constants/theme';
import { api, getUser } from '../utils/api';
import { hp, wp } from '../utils/responsive';

// ── Mood config ────────────────────────────────────────────────────────────────
const MOOD_CFG: Record<string, {
  headerBg: [string,string,string];
  cardBg:   [string,string];
  cloud:    string;
  glow:     string;
  stars:    string[];
  msg:      string;
  rain:     boolean;
}> = {
  '😊': { headerBg:['#2D1B69','#3D2096','#5B2FD4'], cardBg:['#3D2096','#5B2FD4'], cloud:'#7C6FC4', glow:'#B09FFF', stars:['⭐','✨','💛','🌟'], msg:"It's okay to feel this way.\nYou're doing your best 💛", rain:false },
  '😄': { headerBg:['#2D1B69','#3D2096','#5B2FD4'], cardBg:['#6B3A00','#B05A00'], cloud:'#E8A030', glow:'#FFD060', stars:['⭐','🌟','✨','💛'], msg:'Amazing! Keep that energy! 🌟', rain:false },
  '🤩': { headerBg:['#3D0D5E','#6B1090','#9B15C8'], cardBg:['#6B1090','#9B15C8'], cloud:'#D070F0', glow:'#F0A0FF', stars:['🎉','✨','💥','🌈'], msg:"You are on fire today! 🔥", rain:false },
  '😌': { headerBg:['#0D2D5E','#1040A0','#1A5CD4'], cardBg:['#1040A0','#1A5CD4'], cloud:'#6090E0', glow:'#90C0FF', stars:['🌸','💜','✨','🌙'], msg:'Peace and calm surround you 🌙', rain:false },
  '😐': { headerBg:['#252540','#353560','#454580'], cardBg:['#353560','#454580'], cloud:'#7070A0', glow:'#A0A0D0', stars:['💭','⚪','☁️','🌫️'], msg:'Neutral days have their place 💭', rain:false },
  '😔': { headerBg:['#0D1E4A','#1530A0','#2040D0'], cardBg:['#1530A0','#2040D0'], cloud:'#4060C0', glow:'#80A0FF', stars:['💧','🌧️','💙','🫧'], msg:"It's okay to feel this way.\nYou're doing your best 💙", rain:true },
  '😢': { headerBg:['#0D1E6A','#1530C0','#2050E0'], cardBg:['#1530C0','#2050E0'], cloud:'#5070D0', glow:'#90B0FF', stars:['💧','🫧','💙','🌊'], msg:'Let it out. Tomorrow is new 💙', rain:true },
  '😡': { headerBg:['#4A0D0D','#900F0F','#C01515'], cardBg:['#900F0F','#C01515'], cloud:'#D04040', glow:'#FF7070', stars:['🔥','💢','⚡','😤'], msg:"Take a breath. You've got this 💪", rain:false },
  '😰': { headerBg:['#3A2000','#703000','#A04500'], cardBg:['#703000','#A04500'], cloud:'#D07030', glow:'#FFB060', stars:['💨','⚡','💦','😓'], msg:"Breathe slowly. You're safe 🌬️", rain:false },
  '😩': { headerBg:['#2D0D5E','#4B1590','#6B20C8'], cardBg:['#4B1590','#6B20C8'], cloud:'#8050D0', glow:'#C090FF', stars:['💤','🌙','💭','😮‍💨'], msg:'Rest is productive too 💜', rain:false },
};
const D_CFG = {
  headerBg: ['#1A0A4A','#2D1B69','#3D2096'] as [string,string,string],
  cardBg:   ['#2D1B69','#3D2096'] as [string,string],
  cloud: '#5B50A0', glow: '#9080E0',
  stars: ['✨','💫','🌟','⭐'], msg: 'How are you feeling today? 💙', rain: false,
};
const getCfg = (e: string) => MOOD_CFG[e] ?? D_CFG;

const QUOTES = [
  'Every day is a fresh start. 🌅',
  'You are stronger than you think. 💪',
  'Small steps still move you forward. 🚶',
  'Your feelings are valid. 💙',
  "You're doing better than you know. 🌟",
];
const TIPS = [
  'Take 5 slow deep breaths right now 🌬️',
  'Drink a glass of water 💧',
  'Step outside for 5 minutes 🌤️',
  "Write one thing you're grateful for 📝",
  'Stretch your shoulders and neck 🧘',
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
function buildWeekData(moods: any[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const hit = moods.find((m: any) => m.dateKey === key);
    return { label: DAYS[d.getDay()], score: hit?.score ?? 0, emoji: hit?.emoji ?? '' };
  });
}
function moodColor(s: number) {
  if (s >= 4) return '#34C77B'; if (s === 3) return '#A1CFFF';
  if (s === 2) return '#FFCC80'; if (s >= 1) return '#FF8A80';
  return 'rgba(255,255,255,0.15)';
}

// ── Sparkle that floats and fades ─────────────────────────────────────────────

// ── Flame icon — static, no animation (animations removed per request) ──────────
function RealisticFlame({ size = wp(12) }: { size?: number }) {
  // All flicker and ember animations removed — static display only.
  // Same sizes, colours and layer positions kept intact.
  return (
    <View style={{ width: size, height: size * 1.3, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Background layer 1 (dimmer, smaller) */}
      <Text style={{ position: 'absolute', bottom: size * 0.15, fontSize: size * 0.48, opacity: 0.55 }}>🔥</Text>
      {/* Background layer 2 (smallest) */}
      <Text style={{ position: 'absolute', bottom: size * 0.22, fontSize: size * 0.3,  opacity: 0.35 }}>🔥</Text>
      {/* Main flame */}
      <Text style={{ fontSize: size * 0.78 }}>🔥</Text>
    </View>
  );
}

// ── Mood mascot: floating emoji + glow halo + sparkles (NO cloud) ─────────────
function MoodMascot3D({ emoji, cfg }: { emoji: string; cfg: typeof D_CFG }) {
  const floatY = useSharedValue(0);
  const glowS  = useSharedValue(1);
  const popS   = useSharedValue(0);
  const breathS = useSharedValue(1);

  useEffect(() => {
    // Pop in on mount
    popS.value = withSpring(1, { damping: 7, stiffness: 120 });
    // Idle float
    floatY.value = withRepeat(withSequence(
      withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0,   { duration: 1800, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    // Glow pulse
    glowS.value = withRepeat(
      withSequence(withTiming(1.35, { duration: 1400 }), withTiming(1.0, { duration: 1400 })),
      -1, true,
    );
    // Breathing scale on emoji
    breathS.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1200 }), withTiming(0.97, { duration: 1200 })),
      -1, true,
    );
  }, [emoji]);

  const floatSt = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const glowSt  = useAnimatedStyle(() => ({
    transform: [{ scale: glowS.value }],
    opacity: 0.32 / glowS.value,
  }));
  const popSt   = useAnimatedStyle(() => ({ transform: [{ scale: popS.value }] }));
  const breathSt = useAnimatedStyle(() => ({ transform: [{ scale: breathS.value }] }));

  const GLOW = wp(36);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: wp(38), height: wp(36), position: 'relative' }}>
      {/* Outer glow halo */}
      <Animated.View style={[{
        position: 'absolute', width: GLOW, height: GLOW,
        borderRadius: GLOW / 2, backgroundColor: cfg.glow + '40',
      }, glowSt]} />
      {/* Inner soft glow */}
      <View style={{
        position: 'absolute', width: wp(26), height: wp(26),
        borderRadius: wp(13), backgroundColor: cfg.glow + '1A',
      }} />


      {/* Floating emoji with breathing + gradient ring */}
      <Animated.View style={floatSt}>
        <Animated.View style={popSt}>
          <LinearGradient
            colors={[cfg.glow + '55', cfg.glow + '22']}
            style={{
              width: wp(22), height: wp(22), borderRadius: wp(11),
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)',
            }}
          >
            <Animated.Text style={[{ fontSize: wp(13) }, breathSt]}>{emoji}</Animated.Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Animated count-up number ───────────────────────────────────────────────────
function CountUp({ to, decimals = 0, style }: { to: number; decimals?: number; style?: any }) {
  const [val, setVal] = useState('0');
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (ref.current) clearInterval(ref.current);
    let step = 0; const steps = 32;
    ref.current = setInterval(() => {
      step++;
      const v = to * (step / steps);
      setVal(decimals ? v.toFixed(decimals) : Math.round(v).toString());
      if (step >= steps) { setVal(decimals ? to.toFixed(decimals) : to.toString()); clearInterval(ref.current!); }
    }, 28);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [to]);
  return <Text style={style}>{val}</Text>;
}

// ── Glassmorphism stat card (Image 3 style) ────────────────────────────────────
// Each card: dark gradient bg, large icon, big number, sub-label pill
function StatCard3D({
  grad, glow, icon, value, suffix = '', label, subLabel, delay = 0,
}: {
  grad: [string,string]; glow: string; icon: React.ReactNode;
  value: number; suffix?: string; label: string; subLabel: string; delay?: number;
}) {
  const lift  = useSharedValue(1);
  // Glow pulse on card
  const glowP = useSharedValue(1);

 useEffect(() => {
    glowP.value = withRepeat(withSequence(
      withTiming(1.05, { duration: 2000 }),
      withTiming(1.0,  { duration: 2000 }),
    ), -1, true);
  }, []);

  const glowSt  = useAnimatedStyle(() => ({ transform: [{ scale: glowP.value }], opacity: 0.18 }));
  const liftSt  = useAnimatedStyle(() => ({ transform: [{ scale: lift.value }] }));

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPressIn={() => { lift.value = withTiming(0.93, { duration: 80 }); }}
        onPressOut={() => { lift.value = withSpring(1, { damping: 8 }); }}
      >
        <Animated.View style={liftSt}>
          <LinearGradient colors={grad} style={[sc3.card, { shadowColor: glow }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {/* Glow orb */}
            <Animated.View style={[sc3.glowOrb, { backgroundColor: glow }, glowSt]} />
            {/* Star decorations */}
            <Text style={sc3.starTR}>✦</Text>
            <Text style={sc3.starBL}>✦</Text>
            {/* Icon area */}
            <View style={sc3.iconArea}>{icon}</View>
            {/* Value */}
            <Text style={sc3.val}>
              <CountUp to={value} decimals={label === 'Avg Mood' ? 1 : 0} style={sc3.val} />
              {suffix ? <Text style={sc3.suffix}>{suffix}</Text> : null}
            </Text>
            <Text style={sc3.label}>{label}</Text>
            {/* Sub pill */}
            <View style={sc3.pill}>
              <Text style={sc3.pillTxt}>{subLabel}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}
const sc3 = StyleSheet.create({
  card:    { borderRadius: 24, paddingTop: spacing.md, paddingBottom: spacing.sm, paddingHorizontal: 6, minHeight: wp(42), alignItems: 'center', overflow: 'hidden', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12, gap: 3 },
  glowOrb: { position: 'absolute', width: wp(20), height: wp(20), borderRadius: wp(10), top: -wp(6), right: -wp(6) },
  starTR:  { position: 'absolute', top: 10, right: 10, fontSize: wp(3.2), color: 'rgba(255,255,255,0.5)' },
  starBL:  { position: 'absolute', bottom: 36, left: 8, fontSize: wp(2.5), color: 'rgba(255,255,255,0.35)' },
  iconArea:{ width: wp(13), height: wp(13), alignItems: 'center', justifyContent: 'center' },
  val:     { fontSize: wp(7.5), fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  suffix:  { fontSize: wp(4.5), fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  label:   { fontSize: wp(2.8), color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.2 },
  pill:    { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  pillTxt: { fontSize: wp(2.3), color: 'rgba(255,255,255,0.95)', fontWeight: '700' },
});

// ── Calendar 3D icon for "This Week" stat card ─────────────────────────────────
function CalendarIcon3D({ size = wp(12) }: { size?: number }) {
  // Animation removed — static display only
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={['#60A8FF','#3B6FE8']} style={{ width: size, height: size, borderRadius: size * 0.22, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B6FE8', shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 }}>
        <View style={{ position: 'absolute', top: size*0.08, left: size*0.18, right: size*0.18, height: size*0.2, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: size*0.08 }} />
        <Text style={{ fontSize: size * 0.52, marginTop: size * 0.05 }}>📅</Text>
      </LinearGradient>
    </View>
  );
}

// ── Smiley 3D icon for "Avg Mood" stat card ────────────────────────────────────
function SmileyIcon3D({ emoji, size = wp(12) }: { emoji: string; size?: number }) {
  // Animation removed — static display only
  return (
    <View>
      <LinearGradient colors={['#4DE89C','#1EB86A']} style={{ width: size, height: size, borderRadius: size/2, alignItems: 'center', justifyContent: 'center', shadowColor: '#1EB86A', shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 }}>
        <Text style={{ fontSize: size * 0.64 }}>{emoji}</Text>
      </LinearGradient>
    </View>
  );
}

// ── Quick Action card — 3D illustration style (Image 2) ───────────────────────
const QA_DATA = [
  { label: 'Log Mood',    big: '😊', bg: ['#9B6FFF','#7040E0'] as [string,string], glow: '#A87FFF', route: '/(tabs)/MoodTracker' },
  { label: 'Talk to\nMaia', big: '💬', bg: ['#F460A0','#D0207A'] as [string,string], glow: '#F88EC0', route: '/(tabs)/ai' },
  { label: 'My Progress', big: '📈', bg: ['#30C888','#1A9060'] as [string,string], glow: '#50E0A0', route: '/progress' },
  { label: 'My Goals',    big: '🎯', bg: ['#FFB830','#E08010'] as [string,string], glow: '#FFD060', route: '/micro-goals' },
];

function QuickActionCard3D({ item, delay = 0 }: { item: typeof QA_DATA[0]; delay?: number }) {
  // All animations removed — completely static card.
  // Colors, icons, size, spacing, layout unchanged.
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => router.push(item.route as any)}
        style={{ flex: 1 }}
      >
        <LinearGradient colors={item.bg} style={[qaS.card, { shadowColor: item.glow }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Inner glow blob — kept for visual style */}
          <View style={[qaS.blob, { backgroundColor: item.glow + '30' }]} />
          {/* Icon — static, no animation */}
          <Text style={qaS.icon}>{item.big}</Text>
        </LinearGradient>
        {/* Label below card */}
        <Text style={qaS.label}>{item.label}</Text>
      </Pressable>
    </View>
  );
}
const qaS = StyleSheet.create({
  card:  { width: '100%', aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  blob:  { position: 'absolute', width: '80%', height: '80%', borderRadius: 999, top: '-20%', left: '10%' },
  spark: { position: 'absolute', fontSize: wp(3.8) },
  icon:  { fontSize: wp(10.5) },
  label: { fontSize: wp(2.9), fontWeight: '800', color: '#2D2B55', textAlign: 'center', marginTop: 8, lineHeight: wp(4.2) },
});

// ── Dark chart card ────────────────────────────────────────────────────────────
function DarkChartCard({ moods, onPress }: { moods: any[]; onPress: () => void }) {
  const data  = buildWeekData(moods);
  const W = wp(85), H = hp(15);
  const pL=28, pR=10, pT=12, pB=28;
  const w = W-pL-pR, h = H-pT-pB;
  const pts = data.map((d, i) => ({
    x: pL + (i/(data.length-1))*w,
    y: d.score>0 ? pT+(1-(d.score-1)/4)*h : -1,
    score: d.score, label: d.label,
  }));
  const valid = pts.filter(p => p.y >= 0);
  const buildLine = () => {
    if (valid.length < 2) return '';
    let p = `M ${valid[0].x} ${valid[0].y}`;
    for (let i=1; i<valid.length; i++) {
      const pr=valid[i-1],cu=valid[i];
      p += ` C ${pr.x+(cu.x-pr.x)/3} ${pr.y}, ${pr.x+(2*(cu.x-pr.x))/3} ${cu.y}, ${cu.x} ${cu.y}`;
    }
    return p;
  };
  const buildArea = () => {
    const l = buildLine(); if (!l || valid.length<2) return '';
    return `${l} L ${valid[valid.length-1].x} ${pT+h} L ${valid[0].x} ${pT+h} Z`;
  };

  return (
    <LinearGradient colors={['#16133A','#1E1B4B','#252060']} style={dccS.card}>
      <View style={dccS.hdr}>
        <View>
          <Text style={dccS.title}>This Week's Mood 📊</Text>
          <Text style={dccS.sub}>Your emotional trend for 7 days</Text>
        </View>
        <Pressable style={dccS.btn} onPress={onPress}>
          <Text style={dccS.btnTxt}>Full view</Text>
          <Ionicons name="chevron-forward" size={wp(3.5)} color="#A78BFA"/>
        </Pressable>
      </View>
      {moods.length === 0 ? (
        <Text style={{ color:'rgba(255,255,255,0.35)', textAlign:'center', fontSize:wp(3.2), paddingVertical:spacing.lg }}>
          Log moods to see your chart 📊
        </Text>
      ) : (
        <Svg width={W} height={H+4}>
          <Defs>
            <SvgGrad id="dg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#A78BFA" stopOpacity="0.3"/>
              <Stop offset="1" stopColor="#A78BFA" stopOpacity="0.01"/>
            </SvgGrad>
          </Defs>
          {[5,4,3,2,1].map((v,i) => {
            const y = pT+(i/4)*h;
            return <Line key={v} x1={pL} y1={y} x2={pL+w} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray={i===0?'0':'3,3'}/>;
          })}
          {[5,4,3,2,1].map((v,i) => (
            <SvgText key={v} x={pL-5} y={pT+(i/4)*h+4} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="end">{v}</SvgText>
          ))}
          {valid.length>=2 && <Path d={buildArea()} fill="url(#dg)"/>}
          {valid.length>=2 && <Path d={buildLine()} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
          {valid.map((p,i) => <Circle key={i} cx={p.x} cy={p.y} r={5} fill={moodColor(p.score)} stroke="#1E1B4B" strokeWidth="2.5"/>)}
          {pts.map((p,i) => <SvgText key={i} x={p.x} y={H+3} fontSize="9.5" fill="rgba(255,255,255,0.5)" textAnchor="middle">{p.label}</SvgText>)}
        </Svg>
      )}
    </LinearGradient>
  );
}
const dccS = StyleSheet.create({
  card:  { borderRadius: 24, padding: spacing.md, marginBottom: spacing.md, shadowColor:'#6C63FF', shadowOpacity:0.22, shadowRadius:18, elevation:7 },
  hdr:   { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: spacing.sm },
  title: { fontSize: wp(4.2), fontWeight:'800', color:'#fff' },
  sub:   { fontSize: wp(2.9), color:'rgba(255,255,255,0.45)', marginTop:2 },
  btn:   { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(167,139,250,0.18)', paddingHorizontal:10, paddingVertical:4, borderRadius:20, gap:2 },
  btnTxt:{ fontSize: wp(3), color:'#A78BFA', fontWeight:'700' },
});

// ── Achievement badge ──────────────────────────────────────────────────────────
function AchievementBadge({ icon, label, unlocked }: { icon:string; label:string; unlocked:boolean }) {
  const sc = useSharedValue(unlocked ? 0 : 1);
  useEffect(() => { if (unlocked) sc.value = withSpring(1, { damping: 8 }); }, [unlocked]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[abS.badge, !unlocked && abS.locked, st]}>
      <Text style={{ fontSize: wp(7) }}>{icon}</Text>
      <Text style={[abS.lbl, !unlocked && { color:'#AAA' }]}>{label}</Text>
    </Animated.View>
  );
}
const abS = StyleSheet.create({
  badge:  { alignItems:'center', gap:4, padding:spacing.sm, borderRadius:16, backgroundColor:'#fff', minWidth:wp(22), shadowColor:'#6C63FF', shadowOpacity:0.10, shadowRadius:8, elevation:3 },
  locked: { backgroundColor:'#F0EFFA', opacity:0.55 },
  lbl:    { fontSize:wp(2.6), fontWeight:'700', color:'#2D2B55', textAlign:'center' },
});

// ── FAB ────────────────────────────────────────────────────────────────────────
function FAB({ onPress }: { onPress: () => void }) {
  const pulse = useSharedValue(1), press = useSharedValue(1);
 useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.08, { duration: 1800 }),
      withTiming(1.0,  { duration: 1800 }),
    ), -1, true);
  }, []);
  const rS = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const bS = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  return (
    <View style={{ position:'absolute', bottom:spacing.xl, right:spacing.lg, alignItems:'center', justifyContent:'center' }}>
      <Animated.View pointerEvents="none" style={[{ position:'absolute', width:wp(16), height:wp(16), borderRadius:wp(8), backgroundColor:'rgba(108,99,255,0.2)' }, rS]}/>
      <Animated.View style={bS}>
        <Pressable
          style={{ width:wp(15), height:wp(15), borderRadius:wp(7.5), shadowColor:'#6C63FF', shadowOpacity:0.5, shadowRadius:14, shadowOffset:{width:0,height:6}, elevation:10 }}
          onPress={onPress}
          onPressIn={() => { press.value = withTiming(0.88, { duration: 90 }); }}
          onPressOut={() => { press.value = withTiming(1, { duration: 120 }); }}
        >
          <LinearGradient colors={['#6C63FF','#A78BFA']} style={{ flex:1, borderRadius:wp(7.5), alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="add" size={wp(7)} color="#fff"/>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Rotating quote ─────────────────────────────────────────────────────────────
function RotatingQuote() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(i => (i+1) % QUOTES.length); setVis(true); }, 380);
    }, 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <Text style={{ fontSize:wp(3.2), color:'rgba(255,255,255,0.82)', fontStyle:'italic', fontWeight:'600', textAlign:'center', opacity: vis ? 1 : 0 }}>
      {QUOTES[idx]}
    </Text>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const tip     = TIPS[new Date().getDay() % TIPS.length];

  const [todayMood,    setTodayMood]    = useState<any>(null);
  const [streak,       setStreak]       = useState(0);
  const [moodHistory,  setMoodHistory]  = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const user = getUser();

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setChartLoading(true);
      try {
        // Recalculate streak from actual mood history first (fixes stale/wrong streak)
        await api('/mood/recalculate-streak', 'GET', undefined, true).catch(() => {});

        const [moodData, profileData, historyData] = await Promise.all([
          api('/mood/today',   'GET', undefined, true),
          api('/profile/me',   'GET', undefined, true),
          api('/mood/history', 'GET', undefined, true),
        ]);
        setTodayMood(moodData.mood || null);
        setStreak(profileData.user?.streak || 0);
        setMoodHistory(historyData.moods || []);
      } catch (_) {}
      finally { setChartLoading(false); }
    };
    load();
  }, []));

  const firstName     = (user?.name || 'Friend').split(' ')[0];
  const weekData      = buildWeekData(moodHistory);
  const scored        = weekData.filter(d => d.score > 0);
  const loggedThisWeek= scored.length;
  const avgMoodScore  = scored.length ? scored.reduce((s, d) => s+d.score, 0)/scored.length : 0;
  const cfg           = todayMood ? getCfg(todayMood.emoji) : D_CFG;
  const avgEmoji      = avgMoodScore>=4?'😄':avgMoodScore>=3?'🙂':avgMoodScore>=2?'😐':avgMoodScore>0?'😔':'😊';

  return (
    <View style={S.outer}>
      <View style={S.inner}>

        {/* ── HEADER: deep purple gradient, mood-adaptive ── */}
        <LinearGradient
          colors={cfg.headerBg}
          style={[S.header, { paddingTop: insets.top + 8 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Ambient blobs */}
          <View style={S.blob1}/><View style={S.blob2}/><View style={S.blob3}/>

          {/* Row 1: greeting + flame streak badge (Image 3 top-right) */}
          <View style={S.headerRow}>
            <View>
              <Text style={S.greeting}>{getGreeting()} 👋</Text>
              <Text style={S.userName}>{firstName}</Text>
            </View>
            {/* Flame streak badge */}
            <Pressable style={S.streakBadge} onPress={() => router.push('/progress' as any)}>
              <RealisticFlame size={wp(8)}/>
              <Text style={S.streakNum}>{streak}</Text>
              <Text style={S.streakLbl}>Day Streak</Text>
            </Pressable>
          </View>

          {/* Row 2: Mood card (cloud mascot left + info right) */}
          <Animated.View entering={FadeInDown.delay(80).duration(340)} style={S.moodCard}>
            {/* 3D emoji mascot */}
           <View style={{ width: wp(32), alignItems: 'center' }}>
  {todayMood
    ? <Text style={{ fontSize: wp(16), textAlign:'center' }}>{todayMood.emoji}</Text>
    : <Text style={{ fontSize: wp(16), textAlign:'center' }}>🤔</Text>
  }
</View>
            {/* Info column */}
            <View style={S.moodInfo}>
              {todayMood ? (
                <>
                  <View style={S.loggedRow}>
                    <Ionicons name="checkmark-circle" size={wp(4)} color="#34D399"/>
                    <Text style={S.loggedTxt}>Today's mood logged</Text>
                  </View>
                  <Text style={S.moodName}>{todayMood.label} {todayMood.emoji}</Text>
                  <Text style={S.moodMsg}>{cfg.msg}</Text>
                  <TouchableOpacity style={S.updateBtn} onPress={() => router.push('/(tabs)/MoodTracker' as any)}>
                    <Text style={S.updateBtnTxt}>Update Mood</Text>
                    <Ionicons name="pencil" size={wp(3.5)} color="#fff"/>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={S.moodName}>How are you feeling?</Text>
                  <Text style={S.moodMsg}>Tap to log your mood 🌟</Text>
                  <TouchableOpacity style={S.updateBtn} onPress={() => router.push('/(tabs)/MoodTracker' as any)}>
                    <Text style={S.updateBtnTxt}>Log Mood</Text>
                    <Ionicons name="happy-outline" size={wp(3.5)} color="#fff"/>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          {/* Quote */}
          <Animated.View entering={FadeInDown.delay(130).duration(340)} style={{ marginTop: 8, marginBottom: 2 }}>
            <RotatingQuote/>
          </Animated.View>
        </LinearGradient>

        <ScrollView style={S.scroll} contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>

          {/* ── 3 STAT CARDS (Image 3: flame, calendar, smiley) ── */}
          <View style={S.statsRow}>
            <StatCard3D
              grad={['#C84000','#FF6800']} glow="#FF8040"
              icon={<RealisticFlame size={wp(11)}/>}
              value={streak} label="Day Streak" subLabel="Keep it going! 🔥" delay={0}
            />
            <StatCard3D
              grad={['#1A3CC8','#3A6AFF']} glow="#60A0FF"
              icon={<CalendarIcon3D size={wp(12)}/>}
              value={loggedThisWeek} suffix={`/7`} label="This Week" subLabel="You're on track! 🚀" delay={90}
            />
            <StatCard3D
              grad={['#1A8050','#30C878']} glow="#50E0A0"
              icon={<SmileyIcon3D emoji={avgEmoji} size={wp(12)}/>}
              value={avgMoodScore} label="Avg Mood" subLabel="Keep improving! 🌱" delay={180}
            />
          </View>

          {/* ── QUICK ACTIONS: 4 in ONE row (Image 2) ── */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Quick Actions ✦</Text>
            <View style={S.qaRow}>
              {QA_DATA.map((item, i) => <QuickActionCard3D key={item.label} item={item} delay={i * 65}/>)}
            </View>
          </View>

          {/* ── DARK CHART ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            {chartLoading
              ? <View style={[dccS.card, { height: 190, alignItems:'center', justifyContent:'center' }]}>
                  <Skeleton width="90%" height={110} radius={12}/>
                </View>
              : <DarkChartCard moods={moodHistory} onPress={() => router.push('/progress' as any)}/>
            }
          </Animated.View>

          {/* ── ACHIEVEMENTS ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={S.card}>
            <Text style={S.cardTitle}>🏆 Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}>
              <AchievementBadge icon="🔥" label="7 Day Streak"   unlocked={streak>=7}/>
              <AchievementBadge icon="🏆" label="30 Day Champ"   unlocked={streak>=30}/>
              <AchievementBadge icon="⭐" label="Mood Master"     unlocked={loggedThisWeek>=7}/>
              <AchievementBadge icon="💙" label="First Check-in"  unlocked={moodHistory.length>=1}/>
              <AchievementBadge icon="🌟" label="Consistent"      unlocked={loggedThisWeek>=5}/>
            </ScrollView>
          </Animated.View>

          {/* ── DAILY TIP ── */}
          <Animated.View entering={FadeInDown.delay(170).duration(400)}>
            <LinearGradient colors={['#4A3080','#7040B0']} style={[S.card, { overflow:'hidden', padding:0, marginBottom:spacing.md }]}>
              <View style={[S.card, { backgroundColor:'transparent', marginBottom:0, shadowOpacity:0 }]}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 }}>
                  <Ionicons name="leaf-outline" size={wp(5)} color="rgba(255,255,255,0.9)"/>
                  <Text style={[S.cardTitle, { color:'#fff' }]}>Daily Tip 🌱</Text>
                </View>
                <Text style={{ fontSize:wp(3.7), color:'rgba(255,255,255,0.9)', lineHeight:wp(5.5) }}>{tip}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── RECENT ACTIVITY ── */}
          {moodHistory.length > 0 && (
            <Animated.View entering={FadeInDown.delay(190).duration(400)} style={S.card}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:spacing.sm }}>
                <Text style={S.cardTitle}>Recent Activity 🕒</Text>
                <Pressable
                  style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#EDE9FF', paddingHorizontal:10, paddingVertical:4, borderRadius:20, gap:2 }}
                  onPress={() => router.push('/progress' as any)}
                >
                  <Text style={{ fontSize:wp(3), color:'#6C63FF', fontWeight:'700' }}>See all</Text>
                  <Ionicons name="chevron-forward" size={wp(3.5)} color="#6C63FF"/>
                </Pressable>
              </View>
              {moodHistory.slice(0, 4).map((m: any, i: number) => (
                <View key={i} style={{ flexDirection:'row', gap:spacing.sm, marginBottom: i<3 ? spacing.sm : 0 }}>
                  <View style={{ width:wp(9), height:wp(9), borderRadius:wp(4.5), backgroundColor:m.color||'#6C63FF', alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:wp(4.2) }}>{m.emoji}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:wp(3.5), fontWeight:'700', color:'#2D2B55' }}>Logged feeling {m.label}</Text>
                    {!!m.note && <Text style={{ fontSize:wp(3.1), color:'#8B89AC', fontStyle:'italic', marginTop:2 }} numberOfLines={1}>"{m.note}"</Text>}
                    <Text style={{ fontSize:wp(2.8), color:'#B0AECF', marginTop:2, fontWeight:'600' }}>
                      {m.loggedAt ? new Date(m.loggedAt).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── EMERGENCY ── */}
          <Animated.View entering={FadeInDown.delay(210).duration(400)}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/emergency' as any)}>
              <LinearGradient colors={['#FF5070','#FF8090']} style={{ borderRadius:22, padding:spacing.md, flexDirection:'row', alignItems:'center', gap:spacing.md, marginBottom:spacing.md }} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
                <Ionicons name="alert-circle-outline" size={wp(7)} color="#fff"/>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:wp(4), fontWeight:'700', color:'#fff' }}>Need immediate help?</Text>
                  <Text style={{ fontSize:wp(3.2), color:'rgba(255,255,255,0.85)', marginTop:3 }}>Tap to access emergency contacts</Text>
                </View>
                <Ionicons name="chevron-forward" size={wp(5)} color="rgba(255,255,255,0.8)"/>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>

        <FAB onPress={() => router.push('/(tabs)/MoodTracker' as any)}/>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  outer:  { flex:1, backgroundColor:'#1A0A4A', alignItems:'center' },
  inner:  { flex:1, width:'100%', maxWidth:430, backgroundColor:'#F0EEFF', ...(Platform.OS==='web' ? { boxShadow:'0 0 60px rgba(108,99,255,0.25)' } as any : {}) },
 scroll: { flex:1, backgroundColor:'#F7F6FF' },

  // Header
  header:  { paddingHorizontal: spacing.md, paddingBottom: spacing.md, overflow:'hidden' },
  blob1:   { position:'absolute', width:220, height:220, borderRadius:110, backgroundColor:'rgba(255,255,255,0.04)', top:-80, right:-70 },
  blob2:   { position:'absolute', width:160, height:160, borderRadius:80,  backgroundColor:'rgba(255,255,255,0.03)', bottom:-50, left:-50 },
  blob3:   { position:'absolute', width:100, height:100, borderRadius:50,  backgroundColor:'rgba(167,139,250,0.08)', top:'35%', left:'42%' },

  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: spacing.sm },
  greeting:  { fontSize:wp(3.1), color:'rgba(255,255,255,0.75)', fontWeight:'600' },
  userName:  { fontSize:wp(6.2), fontWeight:'900', color:'#fff', letterSpacing:0.5 },

  // Streak badge (top-right, image 3)
  streakBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,255,255,0.12)', paddingHorizontal:spacing.sm+4, paddingVertical:7, borderRadius:18, borderWidth:1, borderColor:'rgba(255,255,255,0.2)' },
  streakNum:   { fontSize:wp(5),   fontWeight:'900', color:'#fff' },
  streakLbl:   { fontSize:wp(2.3), color:'rgba(255,255,255,0.7)', fontWeight:'700' },

  // Mood card (glassmorphism panel, image 3)
 moodCard: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(255,255,255,0.10)', borderRadius:22, padding:6, borderWidth:1, borderColor:'rgba(255,255,255,0.18)', marginBottom:6 },
  moodInfo: { flex:1, gap:7 },
  loggedRow:{ flexDirection:'row', alignItems:'center', gap:5 },
  loggedTxt:{ fontSize:wp(3), color:'rgba(255,255,255,0.88)', fontWeight:'700' },
  moodName: { fontSize:wp(6), fontWeight:'900', color:'#fff', letterSpacing:0.3 },
  moodMsg:  { fontSize:wp(3.1), color:'rgba(255,255,255,0.75)', lineHeight:wp(4.6) },
  updateBtn:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#5B3FD0', paddingHorizontal:14, paddingVertical:9, borderRadius:22, alignSelf:'flex-start', borderWidth:1, borderColor:'rgba(255,255,255,0.25)' },
  updateBtnTxt:{ fontSize:wp(3.3), color:'#fff', fontWeight:'800' },

  // Body
body: { padding: spacing.md, paddingBottom: hp(12) },
  statsRow: { flexDirection:'row', gap: spacing.sm, marginBottom: spacing.md },

  // White cards
  card: { backgroundColor:'#fff', borderRadius:22, padding:spacing.md, marginBottom:spacing.md, shadowColor:'#6C63FF', shadowOpacity:0.08, shadowRadius:14, elevation:4 },
  cardTitle: { fontSize:wp(4.2), fontWeight:'800', color:'#2D2B55', marginBottom:spacing.sm },

  // Quick actions row
  qaRow: { flexDirection:'row', gap: spacing.sm },
});
