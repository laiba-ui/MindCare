import { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { wp, hp } from './utils/responsive';
import { spacing } from '@/constants/theme';
import GradientHeader from '@/components/ui/GradientHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { useToast } from '@/components/ui/ToastProvider';
import { getCustomServerIp, setCustomServerIp, BASE_URL } from './utils/api';

export default function ServerSettings() {
  const router = useRouter();
  const toast  = useToast();
  const [ip, setIp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getCustomServerIp();
    if (current) setIp(current);
  }, []);

  const handleSave = async () => {
    if (!ip.trim()) {
      toast.warning('Error', 'Please enter a valid IP address.');
      return;
    }
    setSaving(true);
    await setCustomServerIp(ip.trim());
    setSaving(false);
    toast.success('Saved! ✅', `Server set to ${ip.trim()}:5000`);
    setTimeout(() => router.back(), 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader title="Server Settings" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.body}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={wp(5)} color="#6C63FF" />
            <Text style={styles.infoText}>
              Enter your laptop's current WiFi/Hotspot IP address (e.g. 192.168.43.123).
              You can find it by running "ipconfig" on your laptop and looking for the IPv4 Address.
            </Text>
          </View>

          <Text style={styles.label}>Current Backend URL</Text>
          <View style={styles.currentBox}>
            <Text style={styles.currentText}>{BASE_URL}</Text>
          </View>

          <Text style={styles.label}>New Server IP Address</Text>
          <View style={styles.inputBox}>
            <Ionicons name="server-outline" size={wp(5)} color="#6C63FF" style={{ marginRight: spacing.sm }} />
            <TextInput
              value={ip}
              onChangeText={setIp}
              placeholder="192.168.43.123"
              placeholderTextColor="#C0BFCF"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <PrimaryButton
            label="Save & Apply"
            loadingLabel="Saving..."
            loading={saving}
            onPress={handleSave}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg },
  infoCard: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: '#EDE9FF',
    borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  infoText: { flex: 1, fontSize: wp(3.2), color: '#2D2B55', lineHeight: wp(5) },
  label: { fontSize: wp(3.3), fontWeight: '700', color: '#6B6A8A', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  currentBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1.5, borderColor: '#E8E6FF',
  },
  currentText: { fontSize: wp(3.5), color: '#2D2B55', fontWeight: '600' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderWidth: 1.5, borderColor: '#E8E6FF',
  },
  input: { flex: 1, fontSize: wp(3.9), color: '#2D2B55' },
});