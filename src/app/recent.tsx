import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { GlacierWave } from '@/components/branding/GlacierWave';
import { SoundDetailModal } from '@/components/SoundDetailModal';
import { SoundIcon } from '@/components/SoundIcon';
import { useSoundSight } from '@/context/SoundSightContext';
import type { SoundEvent } from '@/types/sound';

export default function RecentSoundsScreen() {
  const { soundHistory, isLiveListening, setIsLiveListening, showConfidence } = useSoundSight();
  const [selectedSound, setSelectedSound] = useState<SoundEvent | null>(null);

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0"><GlacierWave height={220} opacity={0.9} /></View>
      <ScrollView className="z-10 flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <AppHeader listening={isLiveListening} onToggleListening={() => setIsLiveListening(!isLiveListening)} />
        <View className="h-12 flex-row items-center justify-between">
          <Text className="text-[20px] font-bold text-[#F7FBFD]">Recent Sounds</Text>
          <View className="h-10 flex-row items-center"><Text className="text-[12px] font-medium text-[#D2E6F0]">See all</Text><ChevronRight size={15} color="#D2E6F0" /></View>
        </View>
        <View className="gap-2">
          {soundHistory.slice(0, 6).map((sound) => {
            const confidence = Math.round((sound.confidence <= 1 ? sound.confidence : sound.confidence / 100) * 100);
            return <Pressable key={sound.id} accessibilityRole="button" accessibilityLabel={`${sound.label}, ${sound.direction}${showConfidence ? `, ${confidence} percent confidence` : ''}`} onPress={() => setSelectedSound(sound)} className="h-[62px] flex-row items-center rounded-[13px] border border-[#55C2E8]/20 bg-[#062C45]/90 px-2.5"><View className="h-10 w-10 items-center justify-center rounded-[10px] bg-[#0A3B59]"><SoundIcon name={sound.iconName} soundType={sound.soundType} size={20} color="#E4F7FD" /></View><View className="ml-3 flex-1"><Text className="text-[14px] font-semibold text-[#F7FBFD]">{sound.label}</Text><Text className="mt-0.5 text-[12px] capitalize text-[#A9C6D8]">{sound.direction.replace('_', ' ')} · {sound.timeAgo || 'Recent'}</Text></View>{showConfidence && <Text className="ml-3 text-[16px] font-medium text-[#F7FBFD]">{confidence}%</Text>}</Pressable>;
          })}
        </View>
      </ScrollView>
      <SoundDetailModal sound={selectedSound} visible={Boolean(selectedSound)} onClose={() => setSelectedSound(null)} />
    </SafeAreaView>
  );
}
