import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { SoundDetailModal } from '@/components/SoundDetailModal';
import { SoundIcon } from '@/components/SoundIcon';
import { useSoundSight } from '@/context/SoundSightContext';
import type { SoundEvent } from '@/types/sound';

interface HistoryRowView {
  key: string;
  sound: SoundEvent;
  label: string;
  direction: string;
  time: string;
  confidence: number;
}

export default function HistoryScreen() {
  const { soundHistory } = useSoundSight();
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundEvent | null>(null);

  const sections = useMemo(() => {
    const [doorKnock, doorbell, voice, appliance, dogBark, car] = soundHistory;
    const today: HistoryRowView[] = [
      doorKnock && { key: 'today-knock', sound: doorKnock, label: 'Door Knock', direction: 'Right', time: '2s ago', confidence: 96 },
      doorbell && { key: 'today-doorbell', sound: doorbell, label: 'Doorbell', direction: 'Front', time: '8s ago', confidence: 87 },
      voice && { key: 'today-voice', sound: voice, label: 'Voice', direction: 'Left', time: '14s ago', confidence: 64 },
      appliance && { key: 'today-appliance', sound: appliance, label: 'Appliance Beep', direction: 'Back', time: '1m ago', confidence: 52 },
    ].filter(Boolean) as HistoryRowView[];
    const yesterday: HistoryRowView[] = [
      dogBark && { key: 'yesterday-dog', sound: dogBark, label: 'Dog Bark', direction: 'Right', time: '5:12 PM', confidence: 78 },
      voice && { key: 'yesterday-voice', sound: voice, label: 'Voice', direction: 'Front', time: '4:33 PM', confidence: 61 },
      car && { key: 'yesterday-car', sound: car, label: 'Car Approaching', direction: 'Left', time: '2:17 PM', confidence: 71 },
    ].filter(Boolean) as HistoryRowView[];
    const normalizedQuery = query.trim().toLowerCase();
    const filterRows = (rows: HistoryRowView[]) => normalizedQuery
      ? rows.filter((row) => `${row.label} ${row.direction} ${row.time}`.toLowerCase().includes(normalizedQuery))
      : rows;
    return { today: filterRows(today), yesterday: filterRows(yesterday) };
  }, [query, soundHistory]);

  const renderSection = (title: string, rows: HistoryRowView[]) => rows.length > 0 && (
    <View className="mb-3">
      <Text className="mb-1.5 text-[13px] font-semibold text-[#35C8F2]">{title}</Text>
      <View className="gap-1.5">
        {rows.map((row) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            accessibilityLabel={`${row.label}, ${row.direction}, ${row.confidence} percent confidence`}
            onPress={() => setSelectedSound(row.sound)}
            className="h-14 flex-row items-center rounded-xl border border-[#55C2E8]/20 bg-[#062C45]/90 px-2.5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-[#0A3B59]">
              <SoundIcon name={row.sound.iconName} soundType={row.sound.soundType} size={20} color="#E4F7FD" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[13px] font-semibold text-[#F7FBFD]">{row.label}</Text>
              <Text className="mt-0.5 text-[11px] text-[#A9C6D8]">{row.direction} · {row.time}</Text>
            </View>
            <Text className="ml-3 text-[15px] font-medium text-[#F7FBFD]">{row.confidence}%</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#021E32]" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="h-14 flex-row items-center justify-between">
          <Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">History</Text>
          <Pressable
            accessibilityLabel="Search history"
            onPress={() => setSearchVisible((visible) => !visible)}
            className="h-11 w-11 items-center justify-center"
          >
            <Search size={22} color="#D6EDF7" strokeWidth={1.8} />
          </Pressable>
        </View>

        {searchVisible && (
          <View className="mb-3 h-10 flex-row items-center rounded-xl border border-[#55C2E8]/20 bg-[#062C45] px-3">
            <Search size={16} color="#6F93A8" />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search sounds"
              placeholderTextColor="#6F93A8"
              className="ml-2 flex-1 text-[13px] text-[#F7FBFD]"
            />
            {query.length > 0 && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><X size={17} color="#A9C6D8" /></Pressable>}
          </View>
        )}

        {renderSection('Today', sections.today)}
        {renderSection('Yesterday', sections.yesterday)}
        {sections.today.length === 0 && sections.yesterday.length === 0 && (
          <View className="items-center py-16"><Text className="text-sm text-[#A9C6D8]">No matching sounds found.</Text></View>
        )}
      </ScrollView>

      <SoundDetailModal sound={selectedSound} visible={Boolean(selectedSound)} onClose={() => setSelectedSound(null)} />
    </SafeAreaView>
  );
}
