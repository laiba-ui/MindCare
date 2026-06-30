import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';
import { HapticTab } from '@/components/haptic-tab';
import { SCREEN_WIDTH } from '../utils/responsive';

const ACTIVE = '#6C63FF';
const INACTIVE = '#A8A6C4';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            height: 64 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ],
      }}
    >

      {/* Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />

      {/* Mood Tracker */}
      <Tabs.Screen
        name="MoodTracker"
        options={{
          title: 'Mood',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name={focused ? 'happy' : 'happy-outline'} focused={focused} color={color} />
          ),
        }}
      />

      {/* AI Assistant */}
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              focused={focused} color={color}
            />
          ),
        }}
      />

      {/* Emergency Help */}
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Help',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'warning' : 'warning-outline'}
              focused={focused} color={color}
              activeBg="#FFE5E8"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
        }}
      />

      {/* Breathing Exercise */}
      <Tabs.Screen
        name="breathing"
        options={{
          title: 'Breathe',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'leaf' : 'leaf-outline'}
              focused={focused} color={color}
              activeBg="#E8FFF3"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile-settings"
        options={{
          href: null,        // hides it from the tab bar
          headerShown: false,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: SCREEN_WIDTH,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 -8px 24px rgba(108,99,255,0.10)' } as any)
      : {
          shadowColor: '#6C63FF',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }),
  },
  item: { paddingTop: 2 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
