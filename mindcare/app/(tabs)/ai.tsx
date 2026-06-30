// app/(tabs)/ai.tsx
// AI chatbot with working microphone and comprehensive crisis keyword detection

import { useState, useRef, useEffect, type ReactNode, useCallback } from 'react';
import {
  StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform, View, Text, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInUp, withRepeat, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import { api, BASE_URL, getAuthToken } from '../utils/api';
import { useToast } from '@/components/ui/ToastProvider';

type Message = {
  id:     string;
  text:   string;
  sender: 'user' | 'ai';
  time:   string;
};

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const INITIAL: Message[] = [{
  id:     '1',
  text:   "Hi there 👋 I'm Maia, your mental health companion. How are you feeling today?",
  sender: 'ai',
  time:   getTime(),
}];

// ── Comprehensive crisis / suicidal keyword detection ────────────────────────
const CRISIS_PATTERNS = [
  // Direct suicidal ideation
  /\b(suicid|kill myself|end my life|take my life|end it all|want to die|wanna die|wish i was dead|wish i were dead|rather be dead)\b/i,
  // Self-harm
  /\b(self.?harm|cut myself|hurt myself|hurting myself|slice|slit my wrists)\b/i,
  // Hopelessness + death
  /\b(no reason to live|nothing to live for|life is not worth|not worth living|can't go on|cannot go on|give up on life|done with life|tired of living|living is too hard)\b/i,
  // Plans/methods
  /\b(overdose|hang myself|jump off|jump from|shoot myself|pills to die|die tonight|die today|die soon)\b/i,
  // Saying goodbye
  /\b(goodbye forever|last message|last time talking|nobody will miss me|no one will miss me|better off without me|world is better without)\b/i,
  // Single critical words in distressing context
  /\bdie\b.*\b(want|wish|going to|will|please|let me)\b/i,
  /\b(want|wish|going to|will|please|let me)\b.*\bdie\b/i,
  /\b(die|death|dead)\b.*\b(myself|me|alone|please)\b/i,
  // Explicit phrases
  /i (don't|do not|dont) want to (be here|exist|live|wake up)/i,
  /i (want|need) to (disappear|vanish|not exist)/i,
];

function isCrisisMessage(text: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(text));
}

function AIAvatar({ small = false }: { small?: boolean }) {
  const size = small ? wp(9) : wp(11);
  return (
    <View style={[aStyles.ring, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
      <View style={[aStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.5 }}>🧠</Text>
      </View>
    </View>
  );
}
const aStyles = StyleSheet.create({
  ring:   { borderWidth: 2, borderColor: '#FF6F9A', justifyContent: 'center', alignItems: 'center' },
  circle: { backgroundColor: '#FFE0EC', justifyContent: 'center', alignItems: 'center' },
});

function Bubble({ msg, showAvatar }: { msg: Message; showAvatar: boolean }) {
  const isUser = msg.sender === 'user';
  return (
    <Animated.View entering={FadeInUp.duration(280)} style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.avatarSlot}>
          {showAvatar ? <AIAvatar small /> : <View style={{ width: wp(9) + 4 }} />}
        </View>
      )}
      <View style={[styles.bubbleCol, isUser && { alignItems: 'flex-end' }]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {msg.text}
          </Text>
        </View>
        <Text style={styles.timeText}>{msg.time}</Text>
      </View>
    </Animated.View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
      <View style={styles.avatarSlot}><AIAvatar small /></View>
      <View style={[styles.bubble, styles.bubbleAI, { paddingVertical: spacing.sm }]}>
        <Text style={{ color: '#AAA', fontSize: wp(3.8) }}>Maia is typing...</Text>
      </View>
    </View>
  );
}

function PressScale({ children, style, onPress, disabled }: {
  children: ReactNode; style?: any; onPress: () => void; disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, animStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => { scale.value = withTiming(0.88, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function AIAssistant() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const toast     = useToast();
  const scrollRef = useRef<ScrollView>(null);

  const [messages,    setMessages]    = useState<Message[]>([]);
const [input,       setInput]       = useState('');
const [typing,      setTyping]      = useState(false);
const [isListening, setIsListening] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [loadingHistory, setLoadingHistory] = useState(true);

  // Web-only speech recognition ref
  const recognitionRef = useRef<any>(null);
  // Native audio recording ref (Android / iOS)
  const recordingRef   = useRef<Audio.Recording | null>(null);

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

// ── Load chat history from backend ──────────────────────────────────────────
useEffect(() => {
  const loadHistory = async () => {
    try {
      const data = await api('/chat/history', 'GET', undefined, true);
      if (data.messages && data.messages.length > 0) {
        const loaded: Message[] = data.messages.map((m: any) => ({
          id:     m._id,
          text:   m.text,
          sender: m.sender === 'maia' ? 'ai' : 'user',
          time:   new Date(m.createdAt).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit',
          }),
        }));
        setMessages(loaded);
      } else {
        // No history yet — show welcome message
        setMessages(INITIAL);
      }
    } catch (err) {
      console.log('Could not load history, showing welcome message');
      setMessages(INITIAL);
    } finally {
      setLoadingHistory(false);
      scrollToBottom();
    }
  };
  loadHistory();
}, []);

  // ── Request audio permission (Android runtime) ────────────────────────────
  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Set audio mode for recording on Android
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:    true,
        playsInSilentModeIOS:  true,
        staysActiveInBackground: false,
        shouldDuckAndroid:     true,
        playThroughEarpieceAndroid: false,
      });

      const { status, canAskAgain } = await Audio.requestPermissionsAsync();

      if (status === 'granted') return true;

      if (!canAskAgain) {
        Alert.alert(
          'Microphone Permission Required',
          'Microphone access was denied. Please go to Settings → Apps → MindCare → Permissions and enable the microphone.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'Microphone Required',
          'MindCare needs microphone access to record voice messages.',
          [{ text: 'OK' }],
        );
      }
      return false;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }, []);

  // ── Microphone handler — Web vs Native (Android/iOS) ────────────────────────
  const handleMic = useCallback(async () => {
    // ── WEB: use browser SpeechRecognition API ────────────────────────────
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (global as any).SpeechRecognition || (global as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.info('Not Supported', 'Speech recognition is not available in this browser.');
        return;
      }

      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
      }

      const recognition          = new SpeechRecognition();
      recognition.lang            = 'en-US';
      recognition.interimResults  = false;
      recognition.maxAlternatives = 1;
      recognition.onstart  = () => setIsListening(true);
      recognition.onend    = () => setIsListening(false);
      recognition.onerror  = () => {
        setIsListening(false);
        toast.error('Mic Error', 'Could not capture audio. Please type instead.');
      };
      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${spoken}` : spoken);
      };
      recognitionRef.current = recognition;
      recognition.start();
      return;
    }

    // ── NATIVE (Android / iOS): expo-av recording ─────────────────────────
    // ── STOP recording if already running ─────────────────────────────────
    if (isListening) {
      try {
        setIsListening(false);
        if (!recordingRef.current) return;

        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (!uri) {
          toast.error('Recording Error', 'No audio file was created. Please try again.');
          return;
        }

        console.log('🎤 Recording stopped, URI:', uri);
        await uploadAndTranscribe(uri);
      } catch (err: any) {
        console.error('Stop recording error:', err);
        toast.error('Recording Error', 'Failed to stop recording. Please try again.');
        recordingRef.current = null;
      }
      return;
    }

    // ── START recording ────────────────────────────────────────────────────
    const granted = await requestAudioPermission();
    if (!granted) return;

    try {
      // Unload any stale recording
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (_) {}
        recordingRef.current = null;
      }

      // Android-compatible high-quality preset
      // AAC in M4A container — universally supported, small file size
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension:          '.m4a',
          outputFormat:       Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder:       Audio.AndroidAudioEncoder.AAC,
          sampleRate:         44100,
          numberOfChannels:   1,
          bitRate:            128000,
        },
        ios: {
          extension:          '.m4a',
          outputFormat:       Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality:       Audio.IOSAudioQuality.HIGH,
          sampleRate:         44100,
          numberOfChannels:   1,
          bitRate:            128000,
          linearPCMBitDepth:  16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat:   false,
        },
        web: {
          mimeType:           'audio/webm',
          bitsPerSecond:      128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;
      setIsListening(true);
      console.log('🎤 Recording started');

      // Auto-stop after 60 seconds to prevent very large files
      setTimeout(async () => {
        if (recordingRef.current && isListening) {
          console.log('⏱ Auto-stopping after 60s');
          await handleMic(); // call stop path
        }
      }, 60000);

    } catch (err: any) {
      console.error('Start recording error:', err);
      setIsListening(false);
      recordingRef.current = null;

      // Provide specific error message for common Android issues
      const msg = err?.message || '';
      if (msg.includes('permission') || msg.includes('PERMISSION')) {
        toast.error('Permission Denied', 'Please allow microphone access in your device settings.');
      } else if (msg.includes('encoder') || msg.includes('codec')) {
        toast.error('Recording Error', 'Audio codec not supported on this device. Please type instead.');
      } else {
        toast.error('Recording Error', `Failed to start recording: ${msg || 'Unknown error'}`);
      }
    }
  }, [isListening, requestAudioPermission]);

  // ── Upload audio file → backend Whisper transcription ────────────────────
  const uploadAndTranscribe = useCallback(async (uri: string) => {
    setIsUploading(true);
    try {
      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        toast.error('File Error', 'Audio file not found. Please try recording again.');
        return;
      }

      console.log('📤 Uploading audio:', uri, 'size:', fileInfo.size, 'bytes');

      // Build the correct file extension and MIME type
      const ext      = uri.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeMap: Record<string, string> = {
        m4a:  'audio/m4a',
        mp4:  'audio/mp4',
        aac:  'audio/aac',
        wav:  'audio/wav',
        webm: 'audio/webm',
        mp3:  'audio/mpeg',
        ogg:  'audio/ogg',
      };
      const mimeType = mimeMap[ext] || 'audio/m4a';

      // Use expo-file-system uploadAsync for reliable multipart upload on Android
      // This avoids the FileReader/Blob issues that break on Android with fetch()
      const token = await getAuthToken();

      const uploadResult = await FileSystem.uploadAsync(
        `${BASE_URL}/speech/transcribe`,
        uri,
        {
          httpMethod:  'POST',
          uploadType:  1,
          fieldName:   'audio',
          mimeType,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          parameters: {},
        },
      );

      console.log('📥 Upload response status:', uploadResult.status);

      if (uploadResult.status !== 200) {
        console.error('Upload failed:', uploadResult.body);
        toast.error('Upload Failed', 'Could not upload audio. Please check your connection.');
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(uploadResult.body);
      } catch {
        console.error('Invalid JSON from server:', uploadResult.body);
        toast.error('Server Error', 'Invalid response from server.');
        return;
      }

      const transcript = parsed?.transcript?.trim();

      if (!transcript) {
        toast.info('No Speech Detected', 'Could not understand the audio. Please try again or type your message.');
        return;
      }

      console.log('✅ Transcript:', transcript);
      // Append transcript to input field so user can review/edit before sending
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      toast.success('Voice Captured', `"${transcript.slice(0, 50)}${transcript.length > 50 ? '…' : ''}"`);

    } catch (err: any) {
      console.error('Upload/transcribe error:', err);
      toast.error('Voice Error', 'Could not process audio. Please try typing instead.');
    } finally {
      setIsUploading(false);
      // Clean up temp file
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (_) {}
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id:     Date.now().toString(),
      text,
      sender: 'user',
      time:   getTime(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setTyping(true);
    scrollToBottom();

    // Client-side crisis detection — catch words the backend might miss
    const clientCrisis = isCrisisMessage(text);

    try {
      const data = await api('/chat/send', 'POST', {
        message: text,
        history: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
      }, true);

      const aiMsg: Message = {
        id:     (Date.now() + 1).toString(),
        text:   data.reply,
        sender: 'ai',
        time:   getTime(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Navigate to counselor alert if backend OR client-side detects crisis
      if (data.alertSent || clientCrisis) {
        setTimeout(() => {
          router.push({
            pathname: '/counselor-alert' as any,
            params:   { mood: 'Chat message', note: text },
          });
        }, 1200);
      }
    } catch {
      // Even on error, still trigger counselor alert for crisis messages
      if (clientCrisis) {
        const crisisReply: Message = {
          id:     (Date.now() + 1).toString(),
          text:   "I hear you, and I'm deeply concerned about what you've shared 💙 You are not alone. Please reach out to a trusted adult or call a crisis helpline right now. I'm alerting your counselor.",
          sender: 'ai',
          time:   getTime(),
        };
        setMessages(prev => [...prev, crisisReply]);
        setTimeout(() => {
          router.push({
            pathname: '/counselor-alert' as any,
            params:   { mood: 'Crisis detected', note: text },
          });
        }, 1500);
      } else {
        const fallbackMsg: Message = {
          id:     (Date.now() + 1).toString(),
          text:   "I'm here for you 💙 Could you tell me more about how you're feeling?",
          sender: 'ai',
          time:   getTime(),
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  };

  if (loadingHistory) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF0F5', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#C2185B', fontSize: wp(4) }}>Loading conversation...</Text>
    </View>
  );
}

return (
  <View style={{ flex: 1, backgroundColor: '#FFF0F5' }}>
      {/* Header */}
      <LinearGradient
        colors={['#C2185B', '#E91E8C']}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(6)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AIAvatar />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={styles.headerName}>Maia</Text>
            <Text style={styles.headerStatus}>● Online</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, i) => {
            const isAI     = msg.sender === 'ai';
            const prevIsAI = i > 0 && messages[i - 1].sender === 'ai';
            return <Bubble key={msg.id} msg={msg} showAvatar={isAI && !prevIsAI} />;
          })}
          {typing && <TypingIndicator />}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type something..."
            placeholderTextColor="#C994B0"
            style={styles.input}
            multiline
            onSubmitEditing={sendMessage}
          />
          {/* Microphone button — Android + Web compatible */}
          <PressScale
            style={[
              styles.micBtn,
              isListening  && styles.micBtnActive,
              isUploading  && styles.micBtnUploading,
            ]}
            onPress={handleMic}
            disabled={isUploading}
          >
            <Ionicons
              name={
                isUploading ? 'cloud-upload-outline'
                : isListening ? 'stop-circle'
                : 'mic'
              }
              size={wp(5.5)}
              color={
                isUploading ? '#FF9800'
                : isListening ? '#fff'
                : '#C2185B'
              }
            />
          </PressScale>
          <PressScale
            onPress={sendMessage}
            style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
            disabled={!input.trim() || typing}
          >
            <Ionicons name="send" size={wp(4.5)} color="#fff" />
          </PressScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn:      { marginRight: spacing.sm, padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerName:   { fontSize: wp(5), fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  headerStatus: { fontSize: wp(3), color: '#FFD6EC', marginTop: 1 },
  messageList:  { padding: spacing.md, paddingBottom: spacing.lg },
  bubbleRow:    { marginBottom: spacing.xs, flexDirection: 'row', alignItems: 'flex-end' },
  bubbleRowAI:  { justifyContent: 'flex-start' },
  bubbleRowUser:{ justifyContent: 'flex-end' },
  avatarSlot:   { marginRight: spacing.xs, marginBottom: 20 },
  bubbleCol:    { maxWidth: wp(68) },
  bubble:       { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20 },
  bubbleAI:     { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#C2185B', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bubbleUser:   { backgroundColor: '#E91E8C', borderBottomRightRadius: 4, shadowColor: '#C2185B', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  bubbleText:   { fontSize: wp(3.9), lineHeight: wp(5.6) },
  bubbleTextAI: { color: '#2D2D2D' },
  bubbleTextUser: { color: '#fff' },
  timeText:     { fontSize: wp(2.8), color: '#AAAAAA', marginTop: 3, marginHorizontal: 4 },
  inputBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2C9DE', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, gap: 6 },
  input:        { flex: 1, backgroundColor: '#FFF0F5', borderRadius: 24, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs, fontSize: wp(3.8), color: '#2D2D2D', maxHeight: hp(12) },
  micBtn:       { width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: '#FFE0EC', alignItems: 'center', justifyContent: 'center' },
  micBtnActive:    { backgroundColor: '#E91E8C' },
  micBtnUploading: { backgroundColor: '#FF9800', opacity: 0.85 },
  sendBtn:      { backgroundColor: '#E91E8C', width: wp(10), height: wp(10), borderRadius: wp(5), justifyContent: 'center', alignItems: 'center', shadowColor: '#C2185B', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  sendBtnDisabled: { backgroundColor: '#F4A7C8', shadowOpacity: 0, elevation: 0 },
});
