// app/send-feedback.tsx
import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import { api } from './utils/api';
import GradientHeader from '@/components/ui/GradientHeader';
import { useToast } from '@/components/ui/ToastProvider';

const CATEGORIES = ['Bug Report', 'Feature Request', 'General Feedback', 'UI Issue', 'Other'];
const RATINGS    = ['😡', '😔', '😐', '😊', '🤩'];

export default function SendFeedback() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [category, setCategory] = useState('General Feedback');
  const [rating,   setRating]   = useState<number | null>(null);
  const [message,  setMessage]  = useState('');
  const [focused,  setFocused]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.warning('Empty message', 'Please write your feedback before sending.');
      return;
    }
    setLoading(true);
    try {
      await api('/feedback/send', 'POST', { category, rating, message: message.trim() }, true);
      toast.success('Thank you! 🙏', 'Your feedback has been submitted.');
      setTimeout(() => router.back(), 900);
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not send feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Send Feedback" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate your experience</Text>
          <View style={styles.ratingRow}>
            {RATINGS.map((r, i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} style={[styles.ratingBtn, rating === i && styles.ratingBtnActive]}>
                <Text style={styles.ratingEmoji}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating !== null && (
            <Text style={styles.ratingLabel}>{['Very Bad','Bad','Okay','Good','Excellent'][rating]}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your feedback</Text>
          <View style={[styles.textBox, focused && styles.textBoxFocused]}>
            <TextInput
              value={message} onChangeText={setMessage}
              placeholder="Tell us what you think..."
              placeholderTextColor="#C0BFCF" multiline style={styles.textInput}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSend} activeOpacity={0.85} style={styles.sendBtn} disabled={loading}>
          <LinearGradient colors={['#6C63FF', '#A78BFA']} style={styles.sendBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="send-outline" size={wp(5)} color="#fff" />
            <Text style={styles.sendBtnText}>{loading ? 'Sending...' : 'Submit Feedback'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn:     { padding: 4, marginRight: spacing.sm },
  headerTitle: { flex: 1, fontSize: wp(5), fontWeight: '700', color: '#fff', textAlign: 'center' },
  body:        { padding: spacing.md },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle:   { fontSize: wp(4.2), fontWeight: '700', color: '#2D2B55', marginBottom: spacing.md },
  ratingRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  ratingBtn:   { width: wp(13), height: wp(13), borderRadius: wp(6.5), backgroundColor: '#F7F6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  ratingBtnActive: { borderColor: '#6C63FF', backgroundColor: '#EDE9FF' },
  ratingEmoji: { fontSize: wp(7) },
  ratingLabel: { textAlign: 'center', marginTop: spacing.sm, fontSize: wp(3.5), color: '#6C63FF', fontWeight: '600' },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip:     { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F7F6FF', borderWidth: 1.5, borderColor: '#E8E6FF' },
  catChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  catText:     { fontSize: wp(3.2), color: '#6B6A8A', fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '700' },
  textBox:     { backgroundColor: '#F7F6FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E6FF', padding: spacing.md, minHeight: hp(15) },
  textBoxFocused: { borderColor: '#6C63FF' },
  textInput:   { fontSize: wp(3.8), color: '#2D2B55', lineHeight: wp(5.5) },
  charCount:   { fontSize: wp(2.8), color: '#CCC', alignSelf: 'flex-end', marginTop: 4 },
  sendBtn:     { borderRadius: 18, overflow: 'hidden' },
  sendBtnGrad: { paddingVertical: spacing.md + 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, borderRadius: 18 },
  sendBtnText: { fontSize: wp(4.5), fontWeight: '700', color: '#fff' },
});