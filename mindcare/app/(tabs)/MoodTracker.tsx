// app/(tabs)/MoodTracker.tsx
// AI-powered mood detection: user types/speaks feelings → AI detects mood
// Falls back to manual emoji selector

import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity,
  View, Text, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/ToastProvider';
import { api, BASE_URL, getToken } from '../utils/api';
import GradientHeader from '@/components/ui/GradientHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';

const MOODS = [
  { emoji: '🤩', label: 'Excited',   score: 5, color: '#FFD700' },
  { emoji: '😄', label: 'Happy',     score: 4, color: '#76C893' },
  { emoji: '😊', label: 'Good',      score: 4, color: '#A8E6CF' },
  { emoji: '🙂', label: 'Okay',      score: 3, color: '#A1CFFF' },
  { emoji: '😐', label: 'Neutral',   score: 3, color: '#CFD8DC' },
  { emoji: '😔', label: 'Sad',       score: 2, color: '#B0BEC5' },
  { emoji: '😢', label: 'Upset',     score: 2, color: '#90A4AE' },
  { emoji: '😰', label: 'Anxious',   score: 2, color: '#FFCC80' },
  { emoji: '😡', label: 'Angry',     score: 1, color: '#FF8A80' },
  { emoji: '😩', label: 'Exhausted', score: 1, color: '#CE93D8' },
  { emoji: '🥺', label: 'Lonely',    score: 1, color: '#F48FB1' },
  { emoji: '😤', label: 'Stressed',  score: 1, color: '#FFAB91' },
];

const getDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Client-side keyword-based mood detection (offline fallback)
function clientSideDetect(text: string): typeof MOODS[0] {
  const t = text.toLowerCase();
  if (/\b(excit|thrill|amaz|fantas|awesome|wow|yay|great)\b/.test(t)) return MOODS[0];
  if (/\b(happy|joy|glad|cheer|pleas|wonderful|delight)\b/.test(t)) return MOODS[1];
  if (/\b(stress|overwhelm|pressure|burden|hectic|too much)\b/.test(t)) return MOODS[11];
  if (/\b(anxious|anxiety|worry|worr|panic|nervous|scared|fear)\b/.test(t)) return MOODS[7];
  if (/\b(angry|anger|mad|furious|rage|annoyed|irritat)\b/.test(t)) return MOODS[8];
  if (/\b(tired|exhaust|drain|worn|fatigue|sleepy)\b/.test(t)) return MOODS[9];
  if (/\b(lone|alone|isolat|miss|nobody|no one)\b/.test(t)) return MOODS[10];
  if (/\b(sad|unhappy|depress|down|blue|low|miserable|cry|crying|upset|hurt)\b/.test(t)) return MOODS[5];
  if (/\b(okay|ok|fine|alright|so-so|meh)\b/.test(t)) return MOODS[3];
  if (/\b(not|no|never|can't|cannot|bad|terrible|awful|horrible)\b/.test(t)) return MOODS[5];
  if (/\b(good|well|nice)\b/.test(t)) return MOODS[2];
  return MOODS[4]; // Neutral
}

function MoodButton({ mood, selected, onPress }: {
  mood: typeof MOODS[0]; selected: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity
      onPress={() => {
        scale.value = withSpring(1.3, { damping: 4 });
        setTimeout(() => { scale.value = withSpring(1); }, 160);
        onPress();
      }}
      activeOpacity={0.8}
      style={{ width: '23%', marginBottom: spacing.xs }}
    >
      <Animated.View style={[
        styles.emojiBtn, anim,
        selected && { borderColor: mood.color, backgroundColor: mood.color + '28' },
      ]}>
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Text
          style={[styles.moodLabel, selected && { color: '#2D2B55', fontWeight: '700' }]}
          numberOfLines={1} adjustsFontSizeToFit
        >{mood.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MoodTracker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast  = useToast();
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  const [inputMode,    setInputMode]    = useState<'ai' | 'manual'>('ai');
  const [selected,     setSelected]     = useState<string | null>(null);
  const [feelingText,  setFeelingText]  = useState('');
  const [note,         setNote]         = useState('');
  const [saved,        setSaved]        = useState<any>(null);
  const [noteFocused,  setNoteFocused]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [detecting,    setDetecting]    = useState(false);
  const [detectedMood, setDetectedMood] = useState<typeof MOODS[0] | null>(null);
  const [isListening,  setIsListening]  = useState(false);
  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<any>(null);

  useEffect(() => {
    if (preset) {
      const found = MOODS.find(m => m.emoji === preset);
      if (found) { setSelected(preset); setInputMode('manual'); }
    }
  }, [preset]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/mood/today', 'GET', undefined, true);
        if (data.mood) setSaved(data.mood);
      } catch (_) {}
    })();
  }, []);

  const selectedData = MOODS.find(m => m.emoji === selected) ?? detectedMood;
  const saveAnim     = useSharedValue(1);
  const saveStyle    = useAnimatedStyle(() => ({ transform: [{ scale: saveAnim.value }] }));

  // ── Microphone / Speech Recognition ──────────────────────────────────────
 // ── Microphone — uses Expo AV recording + Groq Whisper (same as AI chat) ──


const handleMic = async () => {
  // ── STOP recording ────────────────────────────────────────────────────
 
  if (isListening) {
    try {
      setIsListening(false);
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { toast.error('Recording Error', 'No audio captured. Please try again.'); return; }
      await uploadAndTranscribeMood(uri);
    } catch (err) {
      console.error('Stop recording error:', err);
      recordingRef.current = null;
    }
    return;
  }

  // ── START recording ───────────────────────────────────────────────────
  try {
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Please allow microphone access in settings.');
      return;
    }
    const { recording } = await Audio.Recording.createAsync({
      android: {
        extension: '.m4a',
        outputFormat: 2,
        audioEncoder: 3,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'aac' as any,
        audioQuality: 127,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
    });
    recordingRef.current = recording;
    setIsListening(true);
  } catch (err: any) {
    setIsListening(false);
    toast.error('Recording Error', 'Could not start recording. Please type instead.');
  }
};

const uploadAndTranscribeMood = async (uri: string) => {
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) { toast.error('File Error', 'Audio file not found.'); return; }

    const { getAuthToken, BASE_URL } = await import('../utils/api');
    const token = await getAuthToken();

    toast.info('Processing...', 'Transcribing your voice...');

    const uploadResult = await FileSystem.uploadAsync(
      `${BASE_URL}/speech/transcribe`,
      uri,
      {
        httpMethod: 'POST',
        uploadType: 1,
        fieldName:  'audio',
        mimeType:   'audio/m4a',
        headers:    { Authorization: `Bearer ${token}` },
        parameters: {},
      },
    );

    if (uploadResult.status !== 200) {
      toast.error('Upload Failed', 'Could not process audio.');
      return;
    }

    const parsed    = JSON.parse(uploadResult.body);
    const transcript = parsed?.transcript?.trim();

    if (!transcript) {
      toast.info('No Speech', 'Could not detect speech. Please try again or type.');
      return;
    }

    setFeelingText(prev => prev ? `${prev} ${transcript}` : transcript);
    toast.success('Voice Captured ✅', `"${transcript.slice(0, 40)}..."`);

  } catch (err: any) {
    console.error('Mood voice error:', err);
    toast.error('Voice Error', 'Could not process audio. Please type instead.');
  } finally {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (_) {}
  }
};
  // ── AI mood detection ─────────────────────────────────────────────────────
  const detectMoodFromText = async () => {
    const text = feelingText.trim();
    if (!text) {
      toast.warning('Please enter something', 'Describe how you are feeling and AI will detect your mood.');
      return;
    }
    setDetecting(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/mood/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('backend unavailable');
      const data = await res.json();
      const matched =
        MOODS.find(m => m.label.toLowerCase() === (data.mood || '').toLowerCase()) ??
        MOODS.find(m => m.emoji === data.emoji) ??
        clientSideDetect(text);
      setDetectedMood(matched);
      setSelected(matched.emoji);
      if (!note.trim()) setNote(text);
    } catch (_) {
      // Offline fallback
      const detected = clientSideDetect(text);
      setDetectedMood(detected);
      setSelected(detected.emoji);
      if (!note.trim()) setNote(text);
    } finally {
      setDetecting(false);
    }
  };

  // ── Save mood ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selected) {
      toast.warning('Mood not set', 'Please describe your feelings or pick an emoji first.');
      return;
    }
    saveAnim.value = withSpring(0.95, { damping: 5 });
    setTimeout(() => { saveAnim.value = withSpring(1); }, 150);

    const moodData = MOODS.find(m => m.emoji === selected)!;
    setLoading(true);
    try {
      const data = await api('/mood/save', 'POST', {
        emoji:   moodData.emoji,
        label:   moodData.label,
        score:   moodData.score,
        color:   moodData.color,
        note:    note.trim(),
        dateKey: getDateKey(),
      }, true);

      setSaved({
        emoji: moodData.emoji,
        label: moodData.label,
        color: moodData.color,
        note:  note.trim(),
        time:  getTime(),
      });
      setSelected(null);
      setDetectedMood(null);
      setNote('');
      setFeelingText('');

      if (data.alertSent) {
        setTimeout(() => {
          router.push({
            pathname: '/counselor-alert' as any,
            params: { mood: `${moodData.emoji} ${moodData.label}`, note: note.trim() },
          });
        }, 400);
      } else {
       toast.success('Mood saved! ✅', `Logged: ${moodData.emoji} ${moodData.label} · 🔥 Streak: ${data.streak} days`);
// Navigate to home so streak refreshes
setTimeout(() => {
  router.push('/(tabs)/' as any);
}, 1500);
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not save mood. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Mood Tracker" subtitle="Log how you're feeling today" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + hp(4) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Today's saved entry */}
        {saved && (
          <Animated.View entering={FadeInDown.duration(380)} style={[styles.todayCard, { borderLeftColor: saved.color }]}>
            <View style={styles.todayTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayHeading}>Today's Mood</Text>
                <View style={styles.todayMoodRow}>
                  <Text style={styles.todayEmoji}>{saved.emoji}</Text>
                  <Text style={[styles.todayLabel, { color: saved.color === '#FFD700' ? '#B8860B' : saved.color }]}>
                    {saved.label}
                  </Text>
                </View>
                {!!saved.note && <Text style={styles.todayNote}>"{saved.note}"</Text>}
                {!!saved.time && (
                  <View style={styles.todayTimeRow}>
                    <Ionicons name="time-outline" size={wp(3.5)} color="#AAA" />
                    <Text style={styles.todayTime}>Logged at {saved.time}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() => { setSaved(null); setSelected(saved.emoji); setNote(saved.note || ''); }}
              >
                <Ionicons name="create-outline" size={wp(4.5)} color="#6C63FF" />
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Mode toggle */}
        <SegmentedControl
          segments={[
            { key: 'ai', label: 'AI Detect', icon: 'sparkles-outline' },
            { key: 'manual', label: 'Pick Emoji', icon: 'happy-outline' },
          ]}
          value={inputMode}
          onChange={(k) => setInputMode(k as 'ai' | 'manual')}
        />

        {/* AI Mode */}
        {inputMode === 'ai' && (
          <Animated.View entering={FadeInDown.duration(360)} style={styles.card}>
            <Text style={styles.cardTitle}>How are you feeling? 🧠</Text>
            <Text style={styles.cardSub}>Type or speak — AI will detect your mood even from vague descriptions</Text>

            <View style={[styles.aiInputBox, noteFocused && styles.aiInputBoxFocused]}>
              <TextInput
                value={feelingText}
                onChangeText={setFeelingText}
                placeholder="e.g. I've been feeling really overwhelmed with everything lately and can't sleep..."
                placeholderTextColor="#C0BFCF"
                multiline
                style={styles.aiInput}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                maxLength={500}
              />
              <View style={styles.aiInputActions}>
                <Text style={styles.charCount}>{feelingText.length}/500</Text>
                <TouchableOpacity
                  style={[styles.micBtn, isListening && styles.micBtnActive]}
                  onPress={handleMic}
                >
                  <Ionicons
                    name={isListening ? 'stop-circle' : 'mic'}
                    size={wp(5)}
                    color={isListening ? '#fff' : '#6C63FF'}
                  />
                  <Text style={[styles.micLabel, isListening && { color: '#fff' }]}>
                    {isListening ? 'Stop' : 'Speak'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.promptLabel}>Quick prompts:</Text>
            <View style={styles.promptRow}>
              {[
                "I'm feeling really down today",
                "Super stressed about exams",
                "Feeling lonely and disconnected",
                "Actually had a great day!",
              ].map(p => (
                <TouchableOpacity key={p} style={styles.promptChip} onPress={() => setFeelingText(p)}>
                  <Text style={styles.promptChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.detectBtn, (!feelingText.trim() || detecting) && styles.detectBtnDisabled]}
              onPress={detectMoodFromText}
              disabled={!feelingText.trim() || detecting}
            >
              {detecting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="sparkles" size={wp(4.5)} color="#fff" />}
              <Text style={styles.detectBtnText}>
                {detecting ? 'Analyzing your mood...' : 'Detect My Mood with AI'}
              </Text>
            </TouchableOpacity>

            {detectedMood && (
              <View style={[styles.detectedCard, { borderColor: detectedMood.color, backgroundColor: detectedMood.color + '18' }]}>
                <View style={styles.detectedRow}>
                  <Text style={styles.detectedEmoji}>{detectedMood.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detectedLabel}>
                      AI detected: <Text style={{ color: detectedMood.color === '#FFD700' ? '#B8860B' : detectedMood.color, fontWeight: '800' }}>{detectedMood.label}</Text>
                    </Text>
                    <Text style={styles.detectedHint}>Not right? Switch to "Pick Emoji" to change manually.</Text>
                  </View>
                </View>
                {detectedMood.score === 1 && (
                  <Text style={styles.highRiskWarn}>⚠️ Counselor will be notified if you save this mood</Text>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Manual Mode */}
        {inputMode === 'manual' && (
          <Animated.View entering={FadeInDown.duration(360)} style={styles.card}>
            <Text style={styles.cardTitle}>{saved ? 'Update your mood' : 'How are you feeling?'}</Text>
            <View style={styles.moodGrid}>
              {MOODS.map(m => (
                <MoodButton
                  key={m.emoji} mood={m}
                  selected={selected === m.emoji}
                  onPress={() => { setSelected(m.emoji); setDetectedMood(null); }}
                />
              ))}
            </View>
            {selectedData && !detectedMood && (
              <View style={[styles.selectedBadge, { backgroundColor: selectedData.color + '28', borderColor: selectedData.color }]}>
                <Text style={styles.selectedText}>{selectedData.emoji}  Feeling {selectedData.label}</Text>
                {selectedData.score === 1 && (
                  <Text style={styles.highRiskWarn}>⚠️ Counselor will be notified if you save this mood</Text>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.card}>
          <Text style={styles.cardTitle}>Add a note{'  '}<Text style={styles.optional}>(optional)</Text></Text>
          <Text style={styles.cardSub}>Any extra context about your day?</Text>
          <View style={[styles.noteBox, noteFocused && styles.noteBoxFocused]}>
            <TextInput
              value={note} onChangeText={setNote}
              placeholder="e.g. Feeling overwhelmed with assignments today..."
              placeholderTextColor="#C0BFCF" multiline style={styles.noteInput}
              onFocus={() => setNoteFocused(true)} onBlur={() => setNoteFocused(false)}
              maxLength={300}
            />
            <Text style={styles.charCount}>{note.length}/300</Text>
          </View>
        </Animated.View>

        {/* Save */}
        <Animated.View style={saveStyle}>
          <TouchableOpacity
            onPress={handleSave} activeOpacity={0.85} disabled={loading}
            style={[styles.saveBtn, (!selected || loading) && styles.saveBtnDisabled]}
          >
            <LinearGradient
              colors={selected && !loading ? ['#6C63FF', '#A78BFA'] : ['#CCC', '#DDD']}
              style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle-outline" size={wp(5.5)} color="#fff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : "Save Today's Mood"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(360)} style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Log your mood daily to track your emotional health over time. View your history in My Progress.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerTitle: { fontSize: wp(7), fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
  headerSub:   { fontSize: wp(3.5), color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  body:        { padding: spacing.md },
  todayCard:   { backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 5, shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  todayTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  todayHeading:{ fontSize: wp(3.2), fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  todayMoodRow:{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  todayEmoji:  { fontSize: wp(8) },
  todayLabel:  { fontSize: wp(5.5), fontWeight: '800' },
  todayNote:   { fontSize: wp(3.4), color: '#6B6A8A', fontStyle: 'italic', marginBottom: 6 },
  todayTimeRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayTime:   { fontSize: wp(3), color: '#AAA' },
  updateBtn:   { alignItems: 'center', gap: 3, backgroundColor: '#EDE9FF', borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  updateBtnText: { fontSize: wp(2.8), color: '#6C63FF', fontWeight: '600' },
  modeToggleRow: { flexDirection: 'row', backgroundColor: '#EDE9FF', borderRadius: 20, padding: 4, marginBottom: spacing.md, gap: 4 },
  modeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: 18 },
  modeBtnActive: { backgroundColor: '#6C63FF' },
  modeBtnText:   { fontSize: wp(3.5), color: '#6C63FF', fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#6C63FF', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTitle:   { fontSize: wp(4.5), fontWeight: '700', color: '#2D2B55', marginBottom: 4 },
  cardSub:     { fontSize: wp(3.3), color: '#6B6A8A', marginBottom: spacing.md },
  optional:    { fontSize: wp(3.3), color: '#AAA', fontWeight: '400' },
  aiInputBox:  { backgroundColor: '#F7F6FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E6FF', padding: spacing.md, minHeight: hp(14), marginBottom: spacing.sm },
  aiInputBoxFocused: { borderColor: '#6C63FF' },
  aiInput:     { fontSize: wp(3.8), color: '#2D2B55', lineHeight: wp(5.5), minHeight: hp(10) },
  aiInputActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  micBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FF', borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  micBtnActive:{ backgroundColor: '#FF4D5A' },
  micLabel:    { fontSize: wp(3.2), color: '#6C63FF', fontWeight: '600' },
  promptLabel: { fontSize: wp(3.2), color: '#AAA', marginBottom: spacing.xs },
  promptRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  promptChip:  { backgroundColor: '#EDE9FF', borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 5, borderWidth: 1, borderColor: '#C4B5FD' },
  promptChipText: { fontSize: wp(3), color: '#6C63FF', fontWeight: '500' },
  detectBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: spacing.md },
  detectBtnDisabled: { backgroundColor: '#C4B5FD' },
  detectBtnText: { fontSize: wp(4), fontWeight: '700', color: '#fff' },
  detectedCard:{ marginTop: spacing.md, borderRadius: 14, borderWidth: 1.5, padding: spacing.md, gap: spacing.xs },
  detectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detectedEmoji: { fontSize: wp(10) },
  detectedLabel: { fontSize: wp(3.8), color: '#2D2B55', fontWeight: '600' },
  detectedHint:  { fontSize: wp(3), color: '#AAA', marginTop: 3 },
  moodGrid:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emojiBtn:    { alignItems: 'center', backgroundColor: '#F7F6FF', paddingVertical: spacing.sm, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', width: '100%' },
  emoji:       { fontSize: wp(7) },
  moodLabel:   { fontSize: wp(2.9), color: '#6B6A8A', marginTop: 3, textAlign: 'center', width: '100%' },
  selectedBadge: { marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', gap: 4 },
  selectedText:  { fontWeight: '600', fontSize: wp(3.8), color: '#2D2B55' },
  highRiskWarn:  { fontSize: wp(3.2), color: '#FF4D5A', fontWeight: '500', marginTop: 4 },
  noteBox:     { backgroundColor: '#F7F6FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E6FF', padding: spacing.md, minHeight: hp(10) },
  noteBoxFocused: { borderColor: '#6C63FF' },
  noteInput:   { fontSize: wp(3.8), color: '#2D2B55', lineHeight: wp(5.5) },
  charCount:   { fontSize: wp(2.8), color: '#CCC', alignSelf: 'flex-end', marginTop: 4 },
  saveBtn:     { borderRadius: 18, overflow: 'hidden', marginBottom: spacing.md },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGrad: { paddingVertical: spacing.md + 2, alignItems: 'center', borderRadius: 18, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  saveBtnText: { fontSize: wp(4.5), fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tipCard:     { backgroundColor: '#EDE9FF', borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: '#C4B5FD' },
  tipText:     { fontSize: wp(3.3), color: '#2D2B55', lineHeight: wp(5) },
});
