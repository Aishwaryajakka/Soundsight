import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, CircleHelp, Info, LockKeyhole, MessageCircleQuestion } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GlacierWave } from '@/components/branding/GlacierWave';
import { SoundSightWordmark } from '@/components/branding/SoundSightWordmark';

const rows = [
  { label: 'How It Works', icon: MessageCircleQuestion },
  { label: 'Privacy', icon: LockKeyhole },
  { label: 'Help & Support', icon: CircleHelp },
  { label: 'About', icon: Info },
];

export default function AboutScreen() {
  const router = useRouter();
  const [infoPage, setInfoPage] = useState<string | null>(null);
  const detail = infoPage === 'Privacy' ? 'You control SoundSight permissions and can change them anytime in Settings.' : infoPage === 'How It Works' ? 'SoundSight turns detected environmental sound events into clear spatial visual cues.' : infoPage === 'Help & Support' ? 'Review the app controls and accessibility preferences to tailor SoundSight to your needs.' : 'SoundSight makes important sounds visible through calm spatial awareness.';

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0"><GlacierWave height={245} opacity={0.82} /></View>
      <Pressable accessibilityLabel="Back to Settings" onPress={() => router.back()} className="absolute left-3 top-1 z-20 h-11 w-11 items-center justify-center"><ChevronLeft size={25} color="#C6E8F5" /></Pressable>
      <View className="z-10 flex-1 items-center px-5">
        <View className="items-center pt-3">
          <View className="h-[142px] w-[142px] overflow-hidden"><Image source={require('../../assets/SoundSightLogo.png')} resizeMode="contain" style={{ position: 'absolute', width: 250, height: 250, left: -54, top: -23 }} accessibilityIgnoresInvertColors /></View>
          <View className="mt-1"><SoundSightWordmark markSize={0} textSize="xl" /></View>
          <Text className="mt-1 text-[9px] tracking-[3.8px] text-[#C6E8F5]">SOUNDS REVEAL MORE</Text>
        </View>
        <View className="mt-8 w-full rounded-2xl border border-[#55C2E8]/20 bg-[#062C45]/95 px-4">
          {rows.map((row, index) => <Pressable key={row.label} onPress={() => setInfoPage(infoPage === row.label ? null : row.label)} className={`h-[58px] flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/15' : ''}`}><row.icon size={20} color="#D5EDF7" strokeWidth={1.8} /><Text className="ml-3 flex-1 text-[15px] text-[#F7FBFD]">{row.label}</Text><ChevronRight size={19} color="#C6E8F5" strokeWidth={1.8} /></Pressable>)}
        </View>
        {infoPage && <Text className="mt-4 px-3 text-center text-[13px] leading-5 text-[#A9C6D8]">{detail}</Text>}
        <View className="mt-auto items-center pb-7"><Text className="text-center text-[12px] leading-5 tracking-[4px] text-[#D8EDF6]">SAME SOUNDS.{`\n`}A BRIGHTER TOMORROW.</Text><View className="mt-3 h-[2px] w-8 bg-[#40C9F1]" /></View>
      </View>
    </SafeAreaView>
  );
}
