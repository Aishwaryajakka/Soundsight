import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, CircleHelp, Info, LockKeyhole, MessageCircleQuestion } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { useSoundSight } from '@/context/SoundSightContext';
import { ScreenArtwork } from '@/components/ScreenArtwork';
import { BACKGROUND_ASSETS } from '@/services/backgroundAssets';

const Toggle = ({ enabled, onPress, label }: { enabled: boolean; onPress: () => void; label: string }) => <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: enabled }} onPress={onPress} className={`h-7 w-12 rounded-full p-1 ${enabled ? 'bg-[#55C2E8]' : 'bg-[#6F93A8]'}`}><View className={`h-5 w-5 rounded-full bg-[#F7FBFD] ${enabled ? 'translate-x-5' : ''}`} /></Pressable>;
const SectionTitle = ({ children }: { children: string }) => <Text className="mb-3 mt-6 text-lg font-semibold text-[#55C2E8]">{children}</Text>;

export default function SettingsScreen() {
  const router = useRouter();
  const state = useSoundSight();
  const [confirmation, setConfirmation] = useState<null | { title: string; message: string; label: string; action: () => void }>(null);
  const confirm = (title: string, message: string, label: string, action: () => void) => setConfirmation({ title, message, label, action });
  const clearSoundHistory = () => confirm('Clear sound history?', 'This removes locally stored event metadata. Active sounds and settings are not affected.', 'Clear', state.clearHistory);
  const clearTranscripts = () => state.transcripts.length === 0 ? state.showFeedback('No transcripts to clear.') : confirm('Clear conversation transcripts?', 'This removes all locally stored live-caption text.', 'Clear', state.clearTranscripts);
  const clearDemoData = () => confirm('Clear demo data?', 'This removes only the sample sounds and captions. Your real history and settings remain.', 'Clear Demo Data', state.clearDemoData);
  const toggleDemoMode = () => {
    if (!state.demoModeEnabled) { state.enterDemoMode(); return; }
    state.enterLiveMode();
    if (!state.clientMicrophoneEnabled) router.replace('/microphone');
  };
  const infoRows = [
    { label: 'How It Works', slug: 'how-it-works', icon: MessageCircleQuestion },
    { label: 'Privacy', slug: 'privacy', icon: LockKeyhole },
    { label: 'Help & Support', slug: 'help-support', icon: CircleHelp },
    { label: 'About SoundSight', slug: 'about-soundsight', icon: Info },
  ] as const;
  return <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]" edges={['top', 'left', 'right']}>
    <ScreenArtwork source={BACKGROUND_ASSETS.settings} opacity={0.72} />
    <ScrollView className="z-10 flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View className="h-14 justify-center"><Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">Settings</Text></View>
      <SectionTitle>Detection</SectionTitle>
      <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] p-4">
        <Text className="text-[15px] font-semibold text-[#F7FBFD]">Microphone Sensitivity</Text><Text className="mt-1 text-xs text-[#A9C6D8]">Adjust how easily sounds are detected.</Text>
        <View className="mt-3 h-11 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#021E32] p-1">{(['Low', 'Medium', 'High'] as const).map((value) => <Pressable key={value} onPress={() => state.setDetectionSensitivity(value)} className={`flex-1 items-center justify-center rounded-lg ${state.detectionSensitivity === value ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-sm font-medium ${state.detectionSensitivity === value ? 'text-[#021E32]' : 'text-[#C6E8F5]'}`}>{value}</Text></Pressable>)}</View>
        <View className="my-4 h-px bg-[#55C2E8]/15" />
        <Text className="text-[15px] font-semibold text-[#F7FBFD]">Map Fade Duration</Text><Text className="mt-1 text-xs text-[#A9C6D8]">Choose how long detected sounds remain on the map.</Text>
        <View className="mt-3 h-11 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#021E32] p-1">{(['5s', '10s', '20s'] as const).map((value) => <Pressable key={value} onPress={() => state.setKeepEventsVisibleDuration(value)} className={`flex-1 items-center justify-center rounded-lg ${state.keepEventsVisibleDuration === value ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-sm font-medium ${state.keepEventsVisibleDuration === value ? 'text-[#021E32]' : 'text-[#C6E8F5]'}`}>{value}</Text></Pressable>)}</View>
      </View>
      <SectionTitle>Accessibility &amp; Display</SectionTitle>
      <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">
        {[
          { label: 'Show Confidence Percentages', description: 'Show AI confidence for detected sounds.', enabled: state.showConfidence, toggle: () => state.setShowConfidence(!state.showConfidence) },
          { label: 'Luminous Sound Contour Waves', description: 'Show visual sound-wave contours on the map.', enabled: state.showSoundIntensity, toggle: () => state.setShowSoundIntensity(!state.showSoundIntensity) },
          { label: 'Haptic Feedback', description: 'Vibrate for important detected sounds.', enabled: state.hapticAlertsEnabled, toggle: () => state.setHapticAlertsEnabled(!state.hapticAlertsEnabled) },
        ].map((item, index) => <View key={item.label} className={`min-h-[68px] flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/10' : ''}`}><View className="flex-1 pr-3"><Text className="text-[15px] font-semibold text-[#F7FBFD]">{item.label}</Text><Text className="mt-1 text-xs text-[#A9C6D8]">{item.description}</Text></View><Toggle enabled={item.enabled} onPress={item.toggle} label={item.label} /></View>)}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !state.hapticAlertsEnabled }} disabled={!state.hapticAlertsEnabled} onPress={state.testHaptic} className={`h-12 items-center justify-center border-t border-[#55C2E8]/10 ${state.hapticAlertsEnabled ? '' : 'opacity-45'}`}><Text className="text-sm font-semibold text-[#55C2E8]">Test Haptic</Text></Pressable>
      </View>
      <SectionTitle>Data &amp; Privacy</SectionTitle>
      <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] p-4"><Text className="text-[15px] font-semibold text-[#F7FBFD]">Sound History</Text><Text className="mt-1 text-xs leading-5 text-[#A9C6D8]">Detected sound events are stored locally on this device.</Text><Pressable onPress={clearSoundHistory} className="mt-3 h-10 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#55C2E8]">Clear Sound History</Text></Pressable><View className="my-4 h-px bg-[#55C2E8]/10" /><View className="flex-row items-center justify-between"><Text className="text-[15px] font-semibold text-[#F7FBFD]">Conversation Transcripts</Text><Text className="text-xs font-semibold text-[#55C2E8]">7 days</Text></View><Text className="mt-1 text-xs leading-5 text-[#A9C6D8]">Live caption text is stored locally and automatically deleted after 7 days.</Text><Pressable onPress={clearTranscripts} className="mt-3 h-10 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#55C2E8]">Clear Transcripts</Text></Pressable></View>
      <SectionTitle>Demo</SectionTitle>
      <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">
        <View className="min-h-[68px] flex-row items-center"><View className="flex-1 pr-3"><Text className="text-[15px] font-semibold text-[#F7FBFD]">Demo Mode</Text><Text className="mt-1 text-xs text-[#A9C6D8]">Explore deterministic sample sounds and captions.</Text></View><Toggle enabled={state.demoModeEnabled} onPress={toggleDemoMode} label="Demo Mode" /></View>
        <Pressable accessibilityRole="button" onPress={state.loadDemoData} className="h-12 items-center justify-center border-t border-[#55C2E8]/10"><Text className="text-sm font-semibold text-[#55C2E8]">Load Demo Data</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={clearDemoData} disabled={!state.demoModeEnabled} className={`h-12 items-center justify-center border-t border-[#55C2E8]/10 ${state.demoModeEnabled ? '' : 'opacity-40'}`}><Text className="text-sm font-semibold text-[#55C2E8]">Clear Demo Data</Text></Pressable>
      </View>
      <SectionTitle>About</SectionTitle>
      <View className="overflow-hidden rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">{infoRows.map((row, index) => <Pressable key={row.slug} onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: row.slug } } as unknown as Href)} className={`h-14 flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/10' : ''}`}><row.icon size={19} color="#55C2E8" /><Text className="ml-3 flex-1 text-[15px] font-medium text-[#F7FBFD]">{row.label}</Text><ChevronRight size={18} color="#A9C6D8" /></Pressable>)}</View>
    </ScrollView>
    <Modal transparent animationType="fade" visible={Boolean(confirmation)} onRequestClose={() => setConfirmation(null)}><View className="flex-1 items-center justify-center bg-[#011827]/85 px-6"><View className="w-full max-w-[360px] rounded-2xl border border-[#55C2E8]/20 bg-[#062C45] p-5"><Text className="text-lg font-bold text-[#F7FBFD]">{confirmation?.title}</Text><Text className="mt-2 text-[13px] leading-5 text-[#A9C6D8]">{confirmation?.message}</Text><View className="mt-5 flex-row gap-3"><Pressable onPress={() => setConfirmation(null)} className="h-11 flex-1 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#C6E8F5]">Cancel</Text></Pressable><Pressable onPress={() => { const action = confirmation?.action; setConfirmation(null); action?.(); }} className="h-11 flex-1 items-center justify-center rounded-xl bg-[#55C2E8]"><Text className="text-sm font-bold text-[#021E32]">{confirmation?.label}</Text></Pressable></View></View></View></Modal>
  </SafeAreaView>;
}
