import { useRouter } from 'expo-router';
import { Bell, Clock, MapPin, Settings } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_TAB_COLORS, BOTTOM_TAB_METRICS } from '@/constants/navigation';

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
      style={{ height: BOTTOM_TAB_METRICS.baseHeight + insets.bottom, paddingBottom: Math.max(insets.bottom, BOTTOM_TAB_METRICS.minimumBottomPadding), paddingTop: BOTTOM_TAB_METRICS.topPadding, borderTopColor: BOTTOM_TAB_COLORS.border, backgroundColor: BOTTOM_TAB_COLORS.background }}
    >
      {tabs.map((tab) => {
        const selected = tab.label === active;
        const color = selected ? BOTTOM_TAB_COLORS.active : BOTTOM_TAB_COLORS.inactive;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => router.replace(tab.route)}
            className="flex-1 items-center justify-center"
          >
            <tab.icon size={BOTTOM_TAB_METRICS.iconSize} color={color} strokeWidth={2} />
            <Text className="mt-0.5 font-semibold" style={{ color, fontSize: BOTTOM_TAB_METRICS.labelSize, lineHeight: BOTTOM_TAB_METRICS.labelLineHeight }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
