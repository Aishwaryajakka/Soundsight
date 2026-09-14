import { useRouter } from 'expo-router';
import { Bell, Clock, MapPin, Settings } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tabs = [
  { label: 'Map', route: '/(app)/(tabs)/home', icon: MapPin },
  { label: 'History', route: '/(app)/(tabs)/history', icon: Clock },
  { label: 'Alerts', route: '/(app)/(tabs)/alerts', icon: Bell },
  { label: 'Settings', route: '/(app)/(tabs)/settings', icon: Settings },
] as const;

export function StandaloneTabBar({ active }: { active: (typeof tabs)[number]['label'] }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute inset-x-0 bottom-0 flex-row border-t border-[#55C2E8]/20 bg-[#021E32] px-2 pt-1"
      style={{ height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) }}
    >
      {tabs.map((tab) => {
        const selected = tab.label === active;
        const color = selected ? '#55C2E8' : '#8BAABD';
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => router.replace(tab.route)}
            className="flex-1 items-center justify-center"
          >
            <tab.icon size={22} color={color} strokeWidth={2} />
            <Text className="mt-0.5 text-[11px] font-semibold" style={{ color }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
