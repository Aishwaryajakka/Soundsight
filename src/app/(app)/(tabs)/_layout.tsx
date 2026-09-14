import { Tabs } from 'expo-router';
import { MapPin, Clock, Bell, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_TAB_COLORS, BOTTOM_TAB_METRICS } from '@/constants/navigation';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BOTTOM_TAB_COLORS.background,
          borderTopColor: BOTTOM_TAB_COLORS.border,
          borderTopWidth: 1,
          height: BOTTOM_TAB_METRICS.baseHeight + insets.bottom,
          paddingBottom: Math.max(insets.bottom, BOTTOM_TAB_METRICS.minimumBottomPadding),
          paddingTop: BOTTOM_TAB_METRICS.topPadding,
        },
        tabBarActiveTintColor: BOTTOM_TAB_COLORS.active,
        tabBarInactiveTintColor: BOTTOM_TAB_COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: BOTTOM_TAB_METRICS.labelSize,
          fontWeight: '600',
          lineHeight: BOTTOM_TAB_METRICS.labelLineHeight,
          marginTop: 1,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingTop: 0,
        },
        tabBarIconStyle: { marginTop: 0 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapPin size={BOTTOM_TAB_METRICS.iconSize} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Clock size={BOTTOM_TAB_METRICS.iconSize} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={BOTTOM_TAB_METRICS.iconSize} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={BOTTOM_TAB_METRICS.iconSize} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
