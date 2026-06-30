// app/about.tsx
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';

const TEAM = [
  { name: 'Laiba Fawad',  id: '4645-FOC/BSCS/F22', role: 'Developer' },
  { name: 'Asifa Batool',    id: '4669-FOC/BSCS/F22', role: 'Developer' },
  { name: 'Ansa Sajid',   id: '4720-FOC/BSCS/F22', role: 'Developer' },
];

function InfoRow({ icon, label, value, color = '#6C63FF' }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={wp(4.5)} color={color} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function About() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="About MindSpace" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.logoBanner}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🧠</Text>
          </View>
          <Text style={styles.appName}>MindSpace</Text>
          <Text style={styles.appTagline}>Your mental wellness companion</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </Animated.View>

        {/* App info */}
        <Text style={styles.sectionTitle}>App Info</Text>
        <Animated.View entering={FadeInDown.delay(70).duration(400)} style={styles.card}>
          <InfoRow icon="code-slash-outline"   label="Platform"     value="React Native (Expo Router)"  color="#6C63FF" />
          <InfoRow icon="school-outline"       label="University"   value="International Islamic University Islamabad" color="#76C893" />
          <InfoRow icon="person-outline"       label="Supervisor"   value="Ms. Sana Khattak"             color="#A78BFA" />
          <InfoRow icon="calendar-outline"     label="Submitted"    value="2026 — BS Computer Science"   color="#FFB347" />
        </Animated.View>

        {/* Team */}
        <Text style={styles.sectionTitle}>Development Team</Text>
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.card}>
          {TEAM.map((m, i) => (
            <View key={m.id} style={[styles.teamRow, i === TEAM.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{m.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.teamName}>{m.name}</Text>
                <Text style={styles.teamId}>{m.id}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(210).duration(400)} style={styles.descCard}>
          <Text style={styles.descText}>
            MindSpace is an AI-powered student mental health tracker developed as a Final Year Project. It helps university students monitor their emotional wellbeing, chat with an AI assistant, receive micro-goals, and get emergency support when needed.
          </Text>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.disclaimerCard}>
          <Ionicons name="alert-circle-outline" size={wp(5)} color="#FF8A80" />
          <Text style={styles.disclaimerText}>
            MindSpace is not a medical application. It does not provide professional psychological diagnosis or treatment. In case of emergency, please contact a qualified professional.
          </Text>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn:     { padding: 4, marginRight: spacing.sm },
  headerTitle: { flex: 1, fontSize: wp(5), fontWeight: '700', color: '#fff', textAlign: 'center' },
  body:        { padding: spacing.md },
  logoBanner:  { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg, backgroundColor: '#fff', borderRadius: 24, shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  logoCircle:  { width: wp(22), height: wp(22), borderRadius: wp(11), backgroundColor: '#EDE9FF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  logoEmoji:   { fontSize: wp(12) },
  appName:     { fontSize: wp(7), fontWeight: '800', color: '#2D2B55', letterSpacing: 0.5 },
  appTagline:  { fontSize: wp(3.5), color: '#6B6A8A', marginTop: 4 },
  versionBadge:{ marginTop: spacing.sm, backgroundColor: '#EDE9FF', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 20 },
  versionText: { fontSize: wp(3.2), color: '#6C63FF', fontWeight: '600' },
  sectionTitle:{ fontSize: wp(3.5), fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.xs },
  card:        { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: spacing.md, marginBottom: spacing.md, shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F4FF' },
  infoIcon:    { width: wp(9), height: wp(9), borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel:   { fontSize: wp(3), color: '#AAA', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:   { fontSize: wp(3.5), color: '#2D2B55', fontWeight: '500', marginTop: 2 },
  teamRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F4FF' },
  teamAvatar:  { width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: '#EDE9FF', alignItems: 'center', justifyContent: 'center' },
  teamAvatarText: { fontSize: wp(5), fontWeight: '800', color: '#6C63FF' },
  teamName:    { fontSize: wp(3.8), fontWeight: '700', color: '#2D2B55' },
  teamId:      { fontSize: wp(3), color: '#AAA', marginTop: 2 },
  descCard:    { backgroundColor: '#EDE9FF', borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#C4B5FD' },
  descText:    { fontSize: wp(3.4), color: '#2D2B55', lineHeight: wp(5.5) },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#FFF0F0', borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: '#FFD0D0' },
  disclaimerText: { flex: 1, fontSize: wp(3.2), color: '#2D2B55', lineHeight: wp(5) },
});