import { Tabs } from 'expo-router';
import { Compass, Clock, Bell, Sliders } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#021E32',
          borderTopColor: 'rgba(85, 194, 232, 0.18)',
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#55C2E8',
        tabBarInactiveTintColor: '#6F93A8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
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
          tabBarIcon: ({ color }) => <Compass size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Clock size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Sliders size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
