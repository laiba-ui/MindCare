// app/language-settings.tsx
import { useState } from 'react';
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

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English',   available: true  },
  { code: 'ur', name: 'Urdu',    native: 'اردو',      available: false },
  { code: 'ar', name: 'Arabic',  native: 'العربية',   available: false },
  { code: 'fr', name: 'French',  native: 'Français',  available: false },
  { code: 'zh', name: 'Chinese', native: '中文',       available: false },
];

export default function LanguageSettings() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const toast    = useToast();
  const [selected, setSelected] = useState('en');

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Language" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="language-outline" size={wp(5)} color="#6C63FF" />
          <Text style={styles.infoText}>
            More languages coming soon. Currently only English is fully supported.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Select Language</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langRow, i === LANGUAGES.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => {
                if (!lang.available) {
                  toast.info('Coming Soon', `${lang.name} support is coming in a future update.`);
                  return;
                }
                setSelected(lang.code);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langNative}>{lang.native}</Text>
              </View>
              {!lang.available ? (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Soon</Text>
                </View>
              ) : selected === lang.code ? (
                <Ionicons name="checkmark-circle" size={wp(6)} color="#6C63FF" />
              ) : (
                <Ionicons name="ellipse-outline" size={wp(6)} color="#DDD" />
              )}
            </TouchableOpacity>
          ))}
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

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: '#C4B5FD',
  },
  infoText: { flex: 1, fontSize: wp(3.3), color: '#2D2B55' },

  sectionLabel: {
    fontSize: wp(3.5), fontWeight: '700', color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
    shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F4FF',
  },
  langName:   { fontSize: wp(4), fontWeight: '600', color: '#2D2B55' },
  langNative: { fontSize: wp(3.3), color: '#AAA', marginTop: 2 },
  soonBadge:  { backgroundColor: '#F0EEFF', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 20 },
  soonText:   { fontSize: wp(2.8), color: '#6C63FF', fontWeight: '600' },
});