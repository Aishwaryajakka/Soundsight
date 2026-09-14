import type React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Activity, Clock3, Compass, Gauge, Volume2, X } from 'lucide-react-native';
import { SoundIcon } from '@/components/SoundIcon';
import { useSoundSight } from '@/context/SoundSightContext';
import type { SoundEvent } from '@/types/sound';

interface SoundDetailModalProps { sound: SoundEvent | null; visible: boolean; onClose: () => void }

const titleCase = (value: string) => value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const normalizedPercentage = (value: number) => `${Math.round(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100)}%`;
const localTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const SoundDetailModal: React.FC<SoundDetailModalProps> = ({ sound, visible, onClose }) => {
  const { showConfidence } = useSoundSight();
  if (!sound) return null;
  const isCritical = sound.priority === 'critical';
  const category = typeof sound.category === 'string' ? titleCase(sound.category) : null;
  const description = typeof sound.description === 'string' && sound.description.trim() ? sound.description.trim() : null;
  const soundLevel = typeof sound.soundLevelDbfs === 'number' && Number.isFinite(sound.soundLevelDbfs)
    ? `${sound.loudness ? titleCase(sound.loudness) : 'Digital level'} · ${Math.round(sound.soundLevelDbfs)} dBFS`
    : null;
  const details = [
    { label: 'Direction', value: titleCase(sound.direction), icon: Compass },
    ...(showConfidence ? [{ label: 'Confidence', value: normalizedPercentage(sound.confidence), icon: Activity }] : []),
    { label: 'Intensity', value: normalizedPercentage(sound.intensity), icon: Gauge },
    ...(soundLevel ? [{ label: 'Sound Level', value: soundLevel, icon: Volume2 }] : []),
    { label: 'Detected', value: localTimestamp(sound.timestamp), icon: Clock3 },
  ];

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[#011827]/80">
        <Pressable accessibilityRole="button" accessibilityLabel="Close sound details" className="flex-1" onPress={onClose} />
        <View accessibilityViewIsModal className="max-h-[82%] rounded-t-[28px] bg-[#073653] px-5 pb-10 pt-3">
          <View className="mb-4 items-center"><View className="h-1 w-12 rounded-full bg-[#1E6E9A]" /></View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#062C45]"><SoundIcon name={sound.iconName} soundType={sound.soundType} size={22} color={isCritical ? '#FF7A7E' : '#55C2E8'} /></View>
                <View className="flex-1"><Text className="text-xl font-bold text-[#F7FBFD]">{sound.label}</Text><Text className="mt-0.5 text-xs text-[#A9C6D8]">{titleCase(sound.soundType)}</Text></View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close sound details" onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full border border-[#164E72] bg-[#062C45]"><X size={18} color="#C6E8F5" /></Pressable>
            </View>

            <View className="mb-4 flex-row items-center gap-2">
              <View className={`rounded-full px-2.5 py-1 ${isCritical ? 'bg-[#FF5A5F]/20' : 'bg-[#0A3B59]'}`}><Text className={`text-[11px] font-semibold ${isCritical ? 'text-[#FF9A9D]' : 'text-[#8DDCF3]'}`}>{titleCase(sound.priority)} Priority</Text></View>
              {category && <View className="rounded-full bg-[#0A3B59] px-2.5 py-1"><Text className="text-[11px] font-semibold text-[#C6E8F5]">{category}</Text></View>}
            </View>
            {description && <Text className="mb-5 text-sm leading-5 text-[#C6E8F5]">{description}</Text>}

            <View className="mb-6 overflow-hidden rounded-2xl border border-[#55C2E8]/15 bg-[#062C45]/70 px-4">
              {details.map((detail, index) => <View key={detail.label} className={`min-h-14 flex-row items-center ${index > 0 ? 'border-t border-[#55C2E8]/10' : ''}`}><detail.icon size={18} color="#55C2E8" /><Text className="ml-3 flex-1 text-[12px] font-semibold text-[#A9C6D8]">{detail.label}</Text><Text className="max-w-[58%] text-right text-[13px] font-semibold text-[#F7FBFD]">{detail.value}</Text></View>)}
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Acknowledge and close sound details" onPress={onClose} className="h-12 w-full items-center justify-center rounded-xl bg-[#55C2E8]"><Text className="text-sm font-bold text-[#021E32]">Acknowledge &amp; Close</Text></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
