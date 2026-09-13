import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Trash2, X } from 'lucide-react-native';
import { SoundDetailModal } from '@/components/SoundDetailModal';
import { SoundIcon } from '@/components/SoundIcon';
import { useSoundSight } from '@/context/SoundSightContext';
import type { SoundEvent } from '@/types/sound';

interface HistorySection {
  title: string;
  events: SoundEvent[];
}

const formatDirection = (direction: string) =>
  direction.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const formatHistoryTime = (timestamp: number) => {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return 'Unknown time';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return elapsedSeconds < 2 ? 'Just now' : `${elapsedSeconds}s ago`;
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function HistoryScreen() {
  const { soundHistory, clearHistory, showConfidence } = useSoundSight();
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [clearConfirmationVisible, setClearConfirmationVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundEvent | null>(null);

  const sections = useMemo<HistorySection[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? soundHistory.filter((event) =>
          `${event.label} ${event.soundType} ${event.direction}`.toLowerCase().includes(normalizedQuery)
        )
      : soundHistory;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const today: SoundEvent[] = [];
    const yesterday: SoundEvent[] = [];
    const earlier: SoundEvent[] = [];
    filtered.forEach((event) => {
      if (event.timestamp >= startOfToday.getTime()) today.push(event);
      else if (event.timestamp >= startOfYesterday.getTime()) yesterday.push(event);
      else earlier.push(event);
    });
    return [
      { title: 'Today', events: today },
      { title: 'Yesterday', events: yesterday },
      { title: 'Earlier', events: earlier },
    ].filter((section) => section.events.length > 0);
  }, [query, soundHistory]);

  const confirmClearHistory = () => {
    setClearConfirmationVisible(false);
    setSelectedSound(null);
    clearHistory();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#021E32]" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="h-14 flex-row items-center justify-between">
          <Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">History</Text>
          <View className="flex-row items-center">
            {soundHistory.length > 0 && (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear sound history" onPress={() => setClearConfirmationVisible(true)} className="h-11 w-11 items-center justify-center">
                <Trash2 size={20} color="#A9C6D8" strokeWidth={1.8} />
              </Pressable>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Search history" onPress={() => setSearchVisible((visible) => !visible)} className="h-11 w-11 items-center justify-center">
              <Search size={22} color="#D6EDF7" strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {searchVisible && (
          <View className="mb-3 h-10 flex-row items-center rounded-xl border border-[#55C2E8]/20 bg-[#062C45] px-3">
            <Search size={16} color="#6F93A8" />
            <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search sounds" placeholderTextColor="#6F93A8" className="ml-2 flex-1 text-[13px] text-[#F7FBFD]" />
            {query.length > 0 && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><X size={17} color="#A9C6D8" /></Pressable>}
          </View>
        )}

        {sections.map((section) => (
          <View key={section.title} className="mb-3">
            <Text className="mb-1.5 text-[13px] font-semibold text-[#35C8F2]">{section.title}</Text>
            <View className="gap-1.5">
              {section.events.map((sound) => {
                const confidence = Math.round(Math.max(0, Math.min(1, sound.confidence)) * 100);
                return (
                  <Pressable key={sound.id} accessibilityRole="button" accessibilityLabel={`${sound.label}, ${formatDirection(sound.direction)}${showConfidence ? `, ${confidence} percent confidence` : ''}`} onPress={() => setSelectedSound(sound)} className="h-14 flex-row items-center rounded-xl border border-[#55C2E8]/20 bg-[#062C45]/90 px-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-[#0A3B59]"><SoundIcon name={sound.iconName} soundType={sound.soundType} size={20} color="#E4F7FD" /></View>
                    <View className="ml-3 flex-1"><Text className="text-[13px] font-semibold text-[#F7FBFD]">{sound.label}</Text><Text className="mt-0.5 text-[11px] text-[#A9C6D8]">{formatDirection(sound.direction)} · {formatHistoryTime(sound.timestamp)}</Text></View>
                    {showConfidence && <Text className="ml-3 text-[15px] font-medium text-[#F7FBFD]">{confidence}%</Text>}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {sections.length === 0 && <View className="items-center py-16"><Text className="text-sm text-[#A9C6D8]">{soundHistory.length === 0 ? 'No sound history yet.' : 'No matching sounds found.'}</Text></View>}
      </ScrollView>

      <SoundDetailModal sound={selectedSound} visible={Boolean(selectedSound)} onClose={() => setSelectedSound(null)} />

      <Modal transparent animationType="fade" visible={clearConfirmationVisible} onRequestClose={() => setClearConfirmationVisible(false)}>
        <View className="flex-1 items-center justify-center bg-[#011827]/85 px-6">
          <View accessibilityViewIsModal className="w-full max-w-[360px] rounded-2xl border border-[#55C2E8]/20 bg-[#062C45] p-5">
            <Text className="text-lg font-bold text-[#F7FBFD]">Clear sound history?</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#A9C6D8]">This removes all saved sound events from History. Active sounds and settings are not affected.</Text>
            <View className="mt-5 flex-row gap-3">
              <Pressable accessibilityRole="button" onPress={() => setClearConfirmationVisible(false)} className="h-11 flex-1 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#C6E8F5]">Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={confirmClearHistory} className="h-11 flex-1 items-center justify-center rounded-xl bg-[#55C2E8]"><Text className="text-sm font-bold text-[#021E32]">Clear History</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
