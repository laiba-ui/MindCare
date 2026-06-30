// app/(tabs)/profile-settings.tsx
import { useState, useEffect } from 'react';
import {
  StyleSheet, ScrollView, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, Platform, Text, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp } from '../utils/responsive';
import { spacing } from '@/constants/theme';
import { api, updateUserCache } from '../utils/api';
import GradientHeader from '@/components/ui/GradientHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { useToast } from '@/components/ui/ToastProvider';

const AVATARS = ['🧕', '👦', '👧', '🧑', '👨', '👩', '🧔', '👱', '🙋', '🙂', '😎', '🧠'];

function LabeledInput({ label, icon, value, onChangeText, placeholder, keyboard, secure }: {
  label: string; icon: string; value: string;
  onChangeText: (t: string) => void; placeholder?: string;
  keyboard?: any; secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        <Ionicons name={icon as any} size={wp(4.8)} color={focused ? '#6C63FF' : '#B8B5D8'} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor="#C8C6E0"
          secureTextEntry={secure && !showPw} keyboardType={keyboard}
          style={styles.inputText}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          autoCapitalize={secure || keyboard === 'email-address' ? 'none' : 'words'}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPw(!showPw)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={wp(5)} color="#B8B5D8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ProfileSettings() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const toast   = useToast();
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [avatar,    setAvatar]    = useState('🧕');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [uni,       setUni]       = useState('');
  const [year,      setYear]      = useState('');
  const [bio,       setBio]       = useState('');
  const [phone,     setPhone]     = useState('');
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ✅ Always fetch fresh from DB
  useEffect(() => {
    (async () => {
      try {
        const data = await api('/profile/me', 'GET', undefined, true);
        const u    = data.user;
        setAvatar(u.avatar     || '🧕');
        setName(u.name         || '');
        setEmail(u.email       || '');
        setUni(u.university    || '');
        setYear(u.year         || '');
        setBio(u.bio           || '');
        setPhone(u.phone       || '');
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { toast.warning('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const data = await api('/profile/update', 'PUT', {
        name:       name.trim(),
        university: uni.trim(),
        year:       year.trim(),
        bio:        bio.trim(),
        phone:      phone.trim(),
        avatar,
      }, true);
      await updateUserCache(data.user);
      toast.success('Saved! ✅', 'Your profile has been updated.');
     setTimeout(() => router.push('/(tabs)/profile' as any), 900);
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!curPw || !newPw || !confirmPw) {
      toast.warning('Error', 'Please fill all password fields.'); return;
    }
    if (newPw !== confirmPw) {
      toast.warning('Error', 'New passwords do not match.'); return;
    }
    if (newPw.length < 6) {
      toast.warning('Error', 'New password must be at least 6 characters.'); return;
    }
    setSaving(true);
    try {
      await api('/profile/change-password', 'PUT', {
        currentPassword: curPw, newPassword: newPw,
      }, true);
      toast.success('Password changed! ✅');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not change password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F6FF' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6FF' }}>
      <GradientHeader
        title="Edit Profile"
        onBack={() => router.push('/(tabs)/profile' as any)}
        right={(
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose Avatar</Text>
            <View style={styles.bigAvatarRing}>
              <Text style={styles.bigAvatarEmoji}>{avatar}</Text>
            </View>
            <View style={styles.avatarGrid}>
              {AVATARS.map(a => (
                <TouchableOpacity
                  key={a} onPress={() => setAvatar(a)}
                  style={[styles.avatarOption, avatar === a && styles.avatarOptionSelected]}
                >
                  <Text style={styles.avatarEmoji}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Personal info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Info</Text>
            <LabeledInput label="Full Name"  icon="person-outline" value={name}  onChangeText={setName}  placeholder="Your full name" />
            <LabeledInput label="Email"      icon="mail-outline"   value={email} onChangeText={setEmail} placeholder="your@email.com" keyboard="email-address" />
            <LabeledInput label="Phone"      icon="call-outline"   value={phone} onChangeText={setPhone} placeholder="+92 300 0000000" keyboard="phone-pad" />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={bio} onChangeText={setBio}
                  placeholder="A little about yourself..."
                  placeholderTextColor="#C8C6E0"
                  style={[styles.inputText, { height: hp(8) }]}
                  multiline textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Academic */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Academic Info</Text>
            <LabeledInput label="University" icon="school-outline"   value={uni}  onChangeText={setUni}  placeholder="Your university" />
            <LabeledInput label="Study Year" icon="calendar-outline" value={year} onChangeText={setYear} placeholder="e.g. 3rd Year – CS" />
          </View>

          {/* Change password */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <LabeledInput label="Current Password" icon="lock-closed-outline"      value={curPw}     onChangeText={setCurPw}     placeholder="Enter current password" secure />
            <LabeledInput label="New Password"      icon="lock-open-outline"        value={newPw}     onChangeText={setNewPw}     placeholder="Min 6 characters" secure />
            <LabeledInput label="Confirm Password"  icon="shield-checkmark-outline" value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat new password" secure />
            <TouchableOpacity style={styles.changePwBtn} onPress={handleChangePassword} disabled={saving}>
              <Text style={styles.changePwText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          {/* Save */}
          <PrimaryButton label="Save Changes ✓" loadingLabel="Saving..." loading={saving} onPress={handleSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn:      { padding: 4, marginRight: spacing.sm },
  headerTitle:  { flex: 1, fontSize: wp(5), fontWeight: '700', color: '#fff', textAlign: 'center' },
  saveBtn:      { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20 },
  saveBtnText:  { color: '#fff', fontWeight: '700', fontSize: wp(3.8) },
  body:         { padding: spacing.md },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#6C63FF', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle:    { fontSize: wp(4.5), fontWeight: '800', color: '#2D2B55', marginBottom: spacing.md },
  bigAvatarRing:{ alignSelf: 'center', width: wp(26), height: wp(26), borderRadius: wp(13), borderWidth: 3, borderColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, backgroundColor: '#EDE9FF', overflow: 'visible' },
  bigAvatarEmoji: { fontSize: wp(13), lineHeight: wp(15) },
  avatarGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  avatarOption: { width: wp(15), height: wp(15), borderRadius: wp(7.5), backgroundColor: '#F5F4FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', overflow: 'visible' },
  avatarOptionSelected: { borderColor: '#6C63FF', backgroundColor: '#EDE9FF' },
  avatarEmoji:  { fontSize: wp(7) },
  fieldGroup:   { marginBottom: spacing.md },
  fieldLabel:   { fontSize: wp(3.2), fontWeight: '600', color: '#7C7AA0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F6FF', borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1.5, borderColor: '#E8E6FF' },
  inputBoxFocused: { borderColor: '#6C63FF' },
  inputText:    { flex: 1, fontSize: wp(3.9), color: '#2D2B55' },
  changePwBtn:  { backgroundColor: '#EDE9FF', borderRadius: 14, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.sm, borderWidth: 1, borderColor: '#C4B5FD' },
  changePwText: { fontSize: wp(3.8), color: '#6C63FF', fontWeight: '700' },
  primaryBtn:   { borderRadius: 18, overflow: 'hidden', marginTop: spacing.sm },
  primaryBtnGrad: { paddingVertical: spacing.md + 2, alignItems: 'center', borderRadius: 18 },
  primaryBtnText: { fontSize: wp(4.5), fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});