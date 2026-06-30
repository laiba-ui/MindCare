// components/ui/FloatingLabelInput.tsx
// Premium floating-label text input with:
//  - Label animates up when focused or has value
//  - Real-time email validation (triggers red glow + shake if invalid)
//  - Password show/hide toggle with rotating eye icon
//  - Green success ring when `success` prop is true
//  - Red error ring + shake animation when `error` prop is true
//  - Dark-mode aware via useAppTheme()

import { useEffect, useState } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, View,
  type TextInputProps, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, withSpring, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { wp } from '@/app/utils/responsive';
import { spacing, semantic, radii } from '@/constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FloatingLabelInputProps = TextInputProps & {
  label:          string;
  icon?:          string;
  secure?:        boolean;
  success?:       boolean;
  error?:         boolean;
  validateEmail?: boolean;
  hint?:          string;
};

export default function FloatingLabelInput({
  label, icon, secure = false, success = false, error = false,
  validateEmail = false, hint, value = '', onChangeText, onFocus, onBlur, ...rest
}: FloatingLabelInputProps) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [emailErr, setEmailErr] = useState(false);

  const labelTop  = useSharedValue(String(value) ? 6  : 18);
  const labelSize = useSharedValue(String(value) ? 11 : 15);
  const eyeRot    = useSharedValue(0);
  const shakeX    = useSharedValue(0);

  useEffect(() => {
    const up = focused || !!String(value);
    labelTop.value  = withTiming(up ? 6  : 18, { duration: 180 });
    labelSize.value = withTiming(up ? 11 : 15, { duration: 180 });
  }, [focused, value]);

  useEffect(() => {
    if (error || emailErr) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 55, easing: Easing.out(Easing.ease) }),
        withTiming( 8, { duration: 55 }),
        withTiming(-6, { duration: 55 }),
        withTiming( 6, { duration: 55 }),
        withTiming(-3, { duration: 55 }),
        withTiming( 0, { duration: 55 }),
      );
    }
  }, [error, emailErr]);

  const labelStyle = useAnimatedStyle(() => ({
    top: labelTop.value, fontSize: labelSize.value,
    color: focused ? '#6C63FF' : (error || emailErr) ? semantic.error : '#6B6A8A',
  }));
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const eyeStyle   = useAnimatedStyle(() => ({
    transform: [{ rotate: `${eyeRot.value * 15}deg` }],
  }));

  const handleBlur = (e: any) => {
    setFocused(false);
    if (validateEmail && String(value)) setEmailErr(!EMAIL_RE.test(String(value)));
    onBlur?.(e);
  };

  const handleChange = (t: string) => {
    onChangeText?.(t);
    if (validateEmail && emailErr && EMAIL_RE.test(t)) setEmailErr(false);
  };

  const toggleEye = () => {
    setShowPass(v => !v);
    eyeRot.value = withSpring(showPass ? 0 : 1, { damping: 10 });
  };

  const borderColor = (error || emailErr) ? semantic.error : success ? semantic.success : focused ? '#6C63FF' : '#E0DEFF';

  const webShadow = Platform.OS === 'web' ? ({
    boxShadow: focused
      ? `0 0 0 3px ${(error || emailErr) ? 'rgba(255,77,90,0.15)' : success ? 'rgba(46,204,113,0.15)' : 'rgba(108,99,255,0.15)'}`
      : 'none',
  } as any) : {};

  return (
    <View style={styles.outer}>
      <Animated.View style={[styles.wrap, shakeStyle, { borderColor }, webShadow]}>
        {icon && (
          <View style={styles.iconLeft}>
            <Ionicons name={icon as any} size={wp(4.8)} color={focused ? '#6C63FF' : (error || emailErr) ? semantic.error : '#8B89AC'} />
          </View>
        )}
        <Animated.Text style={[styles.label, labelStyle, { left: icon ? wp(11) : spacing.md }]} numberOfLines={1}>
          {label}
        </Animated.Text>
        <TextInput
          {...rest} value={String(value)} onChangeText={handleChange}
          onFocus={e => { setFocused(true); onFocus?.(e); }}
          onBlur={handleBlur}
          secureTextEntry={secure && !showPass}
          style={[styles.input, { paddingLeft: icon ? wp(11) : spacing.md, paddingRight: (secure || success || error || emailErr) ? wp(11) : spacing.md, paddingTop: 22, paddingBottom: 8 }]}
          placeholderTextColor="transparent"
          accessibilityLabel={label}
        />
        <View style={styles.iconRight}>
          {secure ? (
            <TouchableOpacity onPress={toggleEye} hitSlop={10}>
              <Animated.View style={eyeStyle}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={wp(5)} color="#8B89AC" />
              </Animated.View>
            </TouchableOpacity>
          ) : success ? (
            <Ionicons name="checkmark-circle" size={wp(5)} color={semantic.success} />
          ) : (error || emailErr) ? (
            <Ionicons name="alert-circle" size={wp(5)} color={semantic.error} />
          ) : null}
        </View>
      </Animated.View>
      {(hint || emailErr) && (
        <Animated.Text style={[styles.hint, { color: emailErr ? semantic.error : '#AAA' }]}>
          {emailErr ? '⚠ Please enter a valid email address' : hint}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: spacing.md },
  wrap:  { position: 'relative', borderWidth: 1.5, borderRadius: radii.md, height: wp(14), justifyContent: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  label: { position: 'absolute', fontWeight: '600', letterSpacing: 0.1, zIndex: 1 } as any,
  input: { flex: 1, fontSize: wp(4), fontWeight: '500', height: '100%', color: '#2D2B55', outlineStyle: 'none' } as any,
  iconLeft:  { position: 'absolute', left: spacing.md, bottom: 0, height: '100%', justifyContent: 'center', zIndex: 2 },
  iconRight: { position: 'absolute', right: spacing.md, bottom: 0, height: '100%', justifyContent: 'center', zIndex: 2 },
  hint: { fontSize: wp(3), fontWeight: '600', marginTop: 4, marginLeft: spacing.md },
});
