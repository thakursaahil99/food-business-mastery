import { Icon, type IconName } from '@/components/icon';
import { Tabs } from 'expo-router';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/lib/brand';


const ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  classes: ['videocam-outline', 'videocam'],
  learn: ['play-circle-outline', 'play-circle'],
  homework: ['document-text-outline', 'document-text'],
  more: ['menu-outline', 'menu'],
};

/** Icon plus a plain-word label on every tab. The bar grows by the phone's bottom inset so gesture bars never cover it. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Small phones (360 wide and below): tighter pill and label so "Homework" fits without cutting.
  const width = useWindowDimensions().width;
  const narrow = width < 380;
  const tiny = width < 345;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.62)',
        // Own label so the full word always shows: no ellipsis, a touch smaller on small phones.
        tabBarLabel: ({ color, children }) => (
          <Text numberOfLines={1} style={{ color, fontSize: tiny ? 11 : narrow ? 11.5 : 12.5, lineHeight: 16, fontWeight: '700', letterSpacing: tiny ? -0.45 : 0, marginTop: 2 }}>
            {children}
          </Text>
        ),
        tabBarItemStyle: { paddingBottom: 2, paddingHorizontal: 0 },
        // Red pill behind the active tab's icon, like the web Classic look.
        tabBarIcon: ({ focused, color }) => (
          <View style={{ paddingHorizontal: tiny ? 10 : narrow ? 12 : 18, paddingVertical: 4, borderRadius: 99, backgroundColor: focused ? brand.red : 'transparent' }}>
            <Icon name={ICONS[route.name]?.[focused ? 1 : 0] ?? 'ellipse'} size={22} color={color as string} />
          </View>
        ),
        tabBarStyle: {
          height: 76 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: brand.ink,
          borderTopWidth: 0,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="homework" options={{ title: 'Homework' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
