import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const pages = {
  'how-it-works': {
    title: 'How It Works',
    sections: [
      ['Awareness Mode', '1. SoundSight listens for environmental sounds while listening is enabled.\n\n2. AI classifies supported sound categories.\n\n3. SoundSight estimates direction when compatible microphone hardware provides spatial information.\n\n4. The event appears visually on the Sound Map.\n\n5. Important events can trigger haptic feedback.\n\n6. Event metadata can be stored locally in History.'],
      ['Important limitation', 'Sound recognition can make mistakes and SoundSight should not be relied on as an emergency warning system.'],
    ],
  },
  privacy: {
    title: 'Privacy',
    sections: [['Microphone processing', 'Environmental sound detection processes microphone input. Live captions process microphone speech locally when Conversation Mode is enabled.'], ['Local storage', 'Raw environmental and conversation audio is not intentionally stored. History stores SoundEvent metadata locally. Finalized transcript text may be stored locally, automatically expires after 7 days, and can be cleared manually from Settings.']],
  },
  'help-support': {
    title: 'Help & Support',
    sections: [['AI Offline', 'The local detection engine is not connected. Confirm it is running and that the configured WebSocket address is reachable.'], ['No Sounds Detected', 'Check microphone access, sensitivity, and the listening state.'], ['Microphone Unavailable', 'Check microphone permission and the selected input device.'], ['Haptics Not Working', 'Enable Haptic Feedback in Settings and test on a supported physical device.'], ['Demo Mode', 'Demo Mode demonstrates the interface without requiring the live AI engine.']],
  },
  'about-soundsight': {
    title: 'About SoundSight',
    sections: [['SoundSight', 'SOUNDS REVEAL MORE\n\nSoundSight is an accessibility app that turns important environmental sounds into visual, spatial, and haptic information.'], ['Version', Constants.expoConfig?.version ?? '1.0.13']],
  },
} as const;

export default function InformationScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = pages[slug as keyof typeof pages] ?? pages['about-soundsight'];
  return <SafeAreaView className="flex-1 bg-[#021E32]">
    <View className="h-14 flex-row items-center px-2"><Pressable accessibilityLabel="Go back" onPress={() => router.back()} className="h-11 w-11 items-center justify-center"><ChevronLeft size={25} color="#C6E8F5" /></Pressable><Text className="ml-1 text-xl font-bold text-[#F7FBFD]">{page.title}</Text></View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {page.sections.map(([heading, body]) => <View key={heading} className="mb-4 rounded-2xl border border-[#55C2E8]/15 bg-[#062C45] p-4"><Text className="text-[16px] font-semibold text-[#55C2E8]">{heading}</Text><Text className="mt-2 text-[14px] leading-6 text-[#C6E8F5]">{body}</Text></View>)}
    </ScrollView>
  </SafeAreaView>;
}
