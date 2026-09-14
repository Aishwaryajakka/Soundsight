import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Info } from 'lucide-react-native';
import { useRouter, type RelativePathString } from 'expo-router';
import { useSoundSight } from '@/context/SoundSightContext';
import { ScreenArtwork } from '@/components/ScreenArtwork';

const Toggle = ({ enabled, onPress, label }: { enabled: boolean; onPress: () => void; label: string }) => (
  <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: enabled }} onPress={onPress} className={`h-7 w-12 rounded-full p-1 ${enabled ? 'bg-[#55C2E8]' : 'bg-[#6F93A8]'}`}>
    <View className={`h-5 w-5 rounded-full bg-[#F7FBFD] ${enabled ? 'translate-x-5' : ''}`} />
  </Pressable>
);

export default function SettingsScreen() {
  const router = useRouter();
  const state = useSoundSight();

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]" edges={['top', 'left', 'right']}>
      <ScreenArtwork source={require('../../../../assets/background-settings.png')} opacity={0.72} />
      <ScrollView className="z-10 flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="h-14 justify-center"><Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">Settings</Text></View>

        <Text className="mb-3 mt-2 text-lg font-semibold text-[#55C2E8]">Detection &amp; Calibration</Text>
        <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] p-4">
          <Text className="text-[15px] font-semibold text-[#F7FBFD]">Microphone Sensitivity</Text>
          <Text className="mt-1 text-xs text-[#A9C6D8]">Adjust how easily sounds are detected</Text>
          <View className="mt-3 h-11 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#021E32] p-1">{(['Low', 'Medium', 'High'] as const).map((value) => <Pressable key={value} onPress={() => state.setDetectionSensitivity(value)} className={`flex-1 items-center justify-center rounded-lg ${state.detectionSensitivity === value ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-sm font-medium ${state.detectionSensitivity === value ? 'text-[#021E32]' : 'text-[#C6E8F5]'}`}>{value}</Text></Pressable>)}</View>
          <View className="my-4 h-px bg-[#55C2E8]/15" />
          <Text className="text-[15px] font-semibold text-[#F7FBFD]">Map Fade Duration</Text>
          <Text className="mt-1 text-xs text-[#A9C6D8]">How long sounds remain on the map</Text>
          <View className="mt-3 h-11 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#021E32] p-1">{(['5s', '10s', '20s'] as const).map((value) => <Pressable key={value} onPress={() => state.setKeepEventsVisibleDuration(value)} className={`flex-1 items-center justify-center rounded-lg ${state.keepEventsVisibleDuration === value ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-sm font-medium ${state.keepEventsVisibleDuration === value ? 'text-[#021E32]' : 'text-[#C6E8F5]'}`}>{value}</Text></Pressable>)}</View>
        </View>

        <Text className="mb-3 mt-7 text-lg font-semibold text-[#55C2E8]">Accessibility &amp; Display</Text>
        <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">
          {[
            { label: 'Show Confidence Percentages', description: 'Display detection confidence on sounds', enabled: state.showConfidence, toggle: () => state.setShowConfidence(!state.showConfidence) },
            { label: 'Luminous Sound Contour Waves', description: 'Show animated contour waves', enabled: state.showSoundIntensity, toggle: () => state.setShowSoundIntensity(!state.showSoundIntensity) },
            { label: 'Haptic Feedback', description: 'Vibrate on important sounds', enabled: state.hapticAlertsEnabled, toggle: () => state.setHapticAlertsEnabled(!state.hapticAlertsEnabled) },
          ].map((item, index) => <View key={item.label} className={`min-h-[68px] flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/10' : ''}`}><View className="flex-1 pr-3"><Text className="text-[15px] font-semibold text-[#F7FBFD]">{item.label}</Text><Text className="mt-1 text-xs text-[#A9C6D8]">{item.description}</Text></View><Toggle enabled={item.enabled} onPress={item.toggle} label={item.label} /></View>)}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/about' as RelativePathString)} className="mt-5 h-14 flex-row items-center rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">
          <Info size={19} color="#55C2E8" /><Text className="ml-3 flex-1 text-[15px] font-semibold text-[#F7FBFD]">More &amp; About</Text><ChevronRight size={19} color="#A9C6D8" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
