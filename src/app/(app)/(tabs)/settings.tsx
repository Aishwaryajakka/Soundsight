import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, CircleHelp, Info, LockKeyhole, MessageCircleQuestion, Sparkles, X } from 'lucide-react-native';
import { useSoundSight } from '@/context/SoundSightContext';
import { GlacierWave } from '@/components/branding/GlacierWave';
import { SoundSightMark } from '@/components/branding/SoundSightMark';
import { SoundSightWordmark } from '@/components/branding/SoundSightWordmark';
import { SoundIcon } from '@/components/SoundIcon';
import type { DemoScenarioDefinition } from '@/services/soundEventService';

const Toggle = ({ enabled, onPress, label }: { enabled: boolean; onPress: () => void; label: string }) => <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: enabled }} onPress={onPress} className={`h-7 w-12 rounded-full p-1 ${enabled ? 'bg-[#55C2E8]' : 'bg-[#6F93A8]'}`}><View className={`h-5 w-5 rounded-full bg-[#021E32] ${enabled ? 'translate-x-5' : ''}`} /></Pressable>;

export default function SettingsScreen() {
  const state = useSoundSight();
  const [demoExpanded, setDemoExpanded] = useState(false);
  const [lastSimulated, setLastSimulated] = useState<DemoScenarioDefinition | null>(null);
  const [moreVisible, setMoreVisible] = useState(false);
  const [infoPage, setInfoPage] = useState<string | null>(null);

  const triggerDemo = (scenario: DemoScenarioDefinition) => { state.triggerScenario(scenario); setLastSimulated(scenario); };
  const moreRows = [
    { label: 'How It Works', icon: MessageCircleQuestion },
    { label: 'Privacy', icon: LockKeyhole },
    { label: 'Help & Support', icon: CircleHelp },
    { label: 'About', icon: Info },
  ];

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]" edges={['top', 'left', 'right']}>
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
        <GlacierWave height={138} opacity={0.46} />
      </View>
      <ScrollView className="z-10 flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityHint="Long press for More and developer tools"
          onLongPress={() => setMoreVisible(true)}
          className="h-14 justify-center"
        >
          <Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">Settings</Text>
        </Pressable>

        <Text className="mb-3 mt-2 text-lg font-semibold text-[#55C2E8]">Detection &amp; Calibration</Text>
        <View className="rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] p-4">
          <Text className="text-[15px] font-semibold text-[#F7FBFD]">Microphone Sensitivity</Text><Text className="mt-1 text-xs text-[#A9C6D8]">Adjust how easily sounds are detected</Text>
          <View className="mt-3 h-11 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#021E32] p-1">{(['Low', 'Medium', 'High'] as const).map((value) => <Pressable key={value} onPress={() => state.setDetectionSensitivity(value)} className={`flex-1 items-center justify-center rounded-lg ${state.detectionSensitivity === value ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-sm font-medium ${state.detectionSensitivity === value ? 'text-[#021E32]' : 'text-[#C6E8F5]'}`}>{value}</Text></Pressable>)}</View>
          <View className="my-4 h-px bg-[#55C2E8]/15" />
          <Text className="text-[15px] font-semibold text-[#F7FBFD]">Map Fade Duration</Text><Text className="mt-1 text-xs text-[#A9C6D8]">How long sounds remain on the map</Text>
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

      </ScrollView>

      <Modal visible={moreVisible} animationType="slide" onRequestClose={() => setMoreVisible(false)}>
        <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
          <Pressable accessibilityLabel="Close More" onPress={() => { setInfoPage(null); setMoreVisible(false); }} className="absolute right-4 top-14 z-20 h-11 w-11 items-center justify-center"><X size={22} color="#C6E8F5" /></Pressable>
          <View className="z-10 flex-1 items-center px-5 pt-14">
            <SoundSightMark size={104} /><View className="mt-3"><SoundSightWordmark markSize={0} textSize="xl" /></View><Text className="mt-2 text-[10px] tracking-[4px] text-[#C6E8F5]">SOUNDS REVEAL MORE</Text>
            <View className="mt-10 w-full rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] px-4">{moreRows.map((row, index) => <Pressable key={row.label} onPress={() => setInfoPage(infoPage === row.label ? null : row.label)} className={`h-14 flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/10' : ''}`}><row.icon size={20} color="#C6E8F5" /><Text className="ml-3 flex-1 text-[15px] text-[#F7FBFD]">{row.label}</Text><ChevronRight size={18} color="#A9C6D8" /></Pressable>)}</View>
            {infoPage && <Text className="mt-4 px-3 text-center text-sm leading-5 text-[#A9C6D8]">{infoPage === 'Privacy' ? 'You control SoundSight permissions and can change them anytime in Settings.' : infoPage === 'How It Works' ? 'SoundSight turns detected environmental sound events into clear spatial visual cues.' : infoPage === 'Help & Support' ? 'Review the app controls and accessibility preferences to tailor SoundSight to your needs.' : 'SoundSight makes important sounds visible through calm spatial awareness.'}</Text>}
            <View className="mt-4 w-full">
              <Pressable onPress={() => setDemoExpanded(!demoExpanded)} className="h-11 flex-row items-center px-1"><Sparkles size={16} color="#6F93A8" /><Text className="ml-3 flex-1 text-xs font-medium text-[#6F93A8]">Developer / Demo Tools</Text>{demoExpanded ? <ChevronDown size={17} color="#6F93A8" /> : <ChevronRight size={17} color="#6F93A8" />}</Pressable>
              {demoExpanded && <ScrollView className="max-h-40" contentContainerStyle={{ gap: 6 }}>{state.demoScenarios.map((scenario) => <Pressable key={scenario.id} onPress={() => triggerDemo(scenario)} className={`h-12 flex-row items-center rounded-xl border px-3 ${lastSimulated?.id === scenario.id ? 'border-[#55C2E8] bg-[#0A3652]' : 'border-[#55C2E8]/15 bg-[#062C45]'}`}><SoundIcon name={scenario.iconName} soundType={scenario.soundType} size={17} color="#C6E8F5" /><View className="ml-3 flex-1"><Text className="text-xs font-medium text-[#F7FBFD]">{scenario.label}</Text><Text className="text-[10px] capitalize text-[#A9C6D8]">{scenario.direction} · {Math.round(scenario.confidence * 100)}%</Text></View><Text className="text-[10px] font-semibold text-[#55C2E8]">Trigger</Text></Pressable>)}</ScrollView>}
            </View>
            <View className="mt-auto pb-8"><Text className="text-center text-[12px] leading-5 tracking-[4px] text-[#C6E8F5]">SAME SOUNDS.{`\n`}A BRIGHTER TOMORROW.</Text></View>
          </View>
          <View pointerEvents="none" className="absolute inset-x-0 bottom-0"><GlacierWave height={180} opacity={0.8} /></View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
