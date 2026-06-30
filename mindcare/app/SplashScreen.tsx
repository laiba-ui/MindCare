// app/SplashScreen.tsx
import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, withSpring, Easing, runOnJS,
} from 'react-native-reanimated';
import { wp, hp } from './utils/responsive';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  const logoScale   = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleY      = useSharedValue(30);
  const titleOp     = useSharedValue(0);
  const taglineOp   = useSharedValue(0);
  const dotsOp      = useSharedValue(0);
  const ringScale   = useSharedValue(0.6);
  const ringOp      = useSharedValue(0);

  // ✅ Use full group path with 'as any' to bypass typed route check
  const navigate = () => router.replace('/(auth)/login' as any);

  useEffect(() => {
    ringOp.value    = withTiming(1, { duration: 400 });
    ringScale.value = withSpring(1, { damping: 8 });
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    logoScale.value   = withDelay(200, withSpring(1, { damping: 7, stiffness: 120 }));
    titleOp.value = withDelay(600, withTiming(1, { duration: 500 }));
    titleY.value  = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
    taglineOp.value = withDelay(900, withTiming(1, { duration: 500 }));
    dotsOp.value    = withDelay(1100, withTiming(1, { duration: 300 }));
    const timer = setTimeout(() => runOnJS(navigate)(), 2800);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle    = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const ringStyle    = useAnimatedStyle(() => ({ opacity: ringOp.value, transform: [{ scale: ringScale.value }] }));
  const titleStyle   = useAnimatedStyle(() => ({ opacity: titleOp.value, transform: [{ translateY: titleY.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOp.value }));
  const dotsStyle    = useAnimatedStyle(() => ({ opacity: dotsOp.value }));

  return (
    <LinearGradient colors={['#6C63FF', '#A78BFA', '#C4B5FD']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />
      <View style={styles.logoArea}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.logoBg, logoStyle]}>
          <Text style={styles.logoEmoji}>🧠</Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.textBlock, titleStyle]}>
        <Text style={styles.appName}>MindSpace</Text>
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>Your mental wellness companion</Text>
      </Animated.View>
      <Animated.View style={[styles.dots, dotsStyle]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { opacity: 0.5 + i * 0.25 }]} />
        ))}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blobTL: {
    position: 'absolute', top: -hp(5), left: -wp(10),
    width: wp(55), height: wp(55), borderRadius: wp(30),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBR: {
    position: 'absolute', bottom: -hp(5), right: -wp(8),
    width: wp(48), height: wp(48), borderRadius: wp(25),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoArea: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: hp(5), width: wp(40), height: wp(40),
  },
  ring: {
    position: 'absolute', width: wp(38), height: wp(38),
    borderRadius: wp(19), borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoBg: {
    width: wp(26), height: wp(26), borderRadius: wp(13),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  logoEmoji: { fontSize: wp(12), textAlign: 'center' },
  textBlock: { alignItems: 'center', marginBottom: hp(1.5), paddingHorizontal: wp(4) },
  appName:   { fontSize: wp(9), fontWeight: '800', color: '#FFF', letterSpacing: 1.5, textAlign: 'center' },
  tagline:   { fontSize: wp(3.8), color: 'rgba(255,255,255,0.82)', letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: wp(6) },
  dots: { flexDirection: 'row', gap: 8, marginTop: hp(7) },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});