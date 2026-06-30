// app/help-center.tsx
import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';

const FAQS = [
  {
    q: 'How do I log my mood?',
    a: "Go to the Mood tab at the bottom. Select an emoji that matches how you feel, add an optional note, and tap 'Save Today's Mood'.",
  },
  {
    q: 'What is a Micro-Goal?',
    a: 'Micro-goals are small CBT-based wellness tasks like breathing exercises, journaling, or a short walk. They help improve your mood through small positive actions.',
  },
  {
    q: 'Will my counselor be notified automatically?',
    a: 'Yes. If MindSpace detects a high-risk mood (score 1: Angry, Exhausted, Lonely, Stressed) or distressing keywords in your note, an alert is sent to your university counselor.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your mood logs are stored locally on your device. Only counselor alerts in high-risk cases are shared externally. We never sell your data.',
  },
  {
    q: 'What does Maia do?',
    a: "Maia is your AI mental health companion. You can chat with her about how you're feeling and she will provide supportive, CBT-based responses.",
  },
  {
    q: 'How is my mood streak calculated?',
    a: 'Your streak increases by 1 for every consecutive day you log your mood. Missing a day resets it to 0.',
  },
  {
    q: 'Can I update my mood after saving?',
    a: "Yes. Go to the Mood tab — if you already logged today, you'll see your entry with an Update button at the top.",
  },
  {
    q: 'What are the emergency helpline numbers?',
    a: 'Go to the Help tab. We list Rescue 1122, Umang Helpline (0317-4288665), and Rozan Counseling (051-2890505).',
  },
];

function FAQItem({ item, isLast }: { item: typeof FAQS[0]; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={wp(4.5)} color="#6C63FF"
        />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpCenter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Help Center" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>💬</Text>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers to common questions below.</Text>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((f, i) => (
            <FAQItem key={i} item={f} isLast={i === FAQS.length - 1} />
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <View style={[styles.contactIcon, { backgroundColor: '#6C63FF18' }]}>
            <Ionicons name="mail-outline" size={wp(6)} color="#6C63FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSub}>mindspace@university.edu</Text>
          </View>
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

  heroBanner: {
    backgroundColor: '#EDE9FF', borderRadius: 20, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  heroEmoji: { fontSize: wp(10), marginBottom: spacing.sm },
  heroTitle: { fontSize: wp(5.5), fontWeight: '800', color: '#2D2B55' },
  heroSub:   { fontSize: wp(3.4), color: '#6B6A8A', marginTop: 4, textAlign: 'center' },

  sectionLabel: {
    fontSize: wp(3.5), fontWeight: '700', color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
    shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  faqItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F4FF',
  },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  faqQ:      { flex: 1, fontSize: wp(3.8), fontWeight: '600', color: '#2D2B55' },
  faqA:      { fontSize: wp(3.4), color: '#6B6A8A', marginTop: spacing.sm, lineHeight: wp(5.2) },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#EDE9FF', borderRadius: 16, padding: spacing.md,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  contactIcon:  { width: wp(12), height: wp(12), borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontSize: wp(4), fontWeight: '700', color: '#2D2B55' },
  contactSub:   { fontSize: wp(3.2), color: '#6C63FF', marginTop: 2 },
});