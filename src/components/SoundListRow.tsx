import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SoundEvent } from '@/types/sound';
import { SoundIcon } from './SoundIcon';

interface SoundListRowProps { sound: SoundEvent; onPress?: () => void; trailing?: React.ReactNode; card?: boolean }
export const SoundListRow: React.FC<SoundListRowProps> = ({ sound, onPress, trailing, card = true }) => {
  const confidence = Math.round((sound.confidence <= 1 ? sound.confidence : sound.confidence / 100) * 100);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${sound.label}, ${sound.direction.replace('_', ' ')}, ${confidence} percent confidence`} onPress={onPress} className={`min-h-16 flex-row items-center px-3 py-2.5 ${card ? 'rounded-[14px] border border-[#55C2E8]/15 bg-[#062C45]' : ''}`}>
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#0A3652]"><SoundIcon name={sound.iconName} soundType={sound.soundType} size={20} color="#C6E8F5" /></View>
      <View className="ml-3 flex-1"><Text className="text-[15px] font-semibold text-[#F7FBFD]">{sound.label}</Text><Text className="mt-0.5 text-xs capitalize text-[#A9C6D8]">{sound.direction.replace('_', ' ')} · {sound.timeAgo || 'Recent'}</Text></View>
      <Text className="ml-3 text-[15px] font-semibold text-[#F7FBFD]">{confidence}%</Text>
      {trailing}
    </Pressable>
  );
};
