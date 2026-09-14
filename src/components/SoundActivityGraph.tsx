import { Text, View } from 'react-native';
import type { SoundEvent } from '@/types/sound';

const TIME_BUCKETS = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'] as const;

export interface HistoryAnalytics {
  soundsToday: number;
  mostCommon: string;
  averageConfidence: number;
  activity: number[];
}

export function deriveHistoryAnalytics(events: SoundEvent[], now = new Date()): HistoryAnalytics {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const today = events.filter((event) => event.timestamp >= start.getTime() && event.timestamp <= now.getTime());
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.label, (counts.get(event.label) ?? 0) + 1);
  const mostCommon = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? '—';
  const averageConfidence = events.length === 0 ? 0 : events.reduce((sum, event) => sum + Math.max(0, Math.min(1, event.confidence)), 0) / events.length;
  const activity = Array.from({ length: 12 }, () => 0);
  for (const event of today) activity[Math.min(11, Math.floor(new Date(event.timestamp).getHours() / 2))] += 1;
  return { soundsToday: today.length, mostCommon, averageConfidence, activity };
}

export function SoundActivityGraph({ events }: { events: SoundEvent[] }) {
  const analytics = deriveHistoryAnalytics(events);
  const maximum = Math.max(1, ...analytics.activity);
  return (
    <View className="mb-4 rounded-2xl border border-[#55C2E8]/15 bg-[#062C45]/90 p-3">
      <View className="flex-row">
        <View className="flex-1"><Text className="text-[10px] uppercase tracking-wide text-[#8BAABD]">Sounds Today</Text><Text className="mt-1 text-xl font-bold text-[#F7FBFD]">{analytics.soundsToday}</Text></View>
        <View className="flex-[1.5]"><Text className="text-[10px] uppercase tracking-wide text-[#8BAABD]">Most Common</Text><Text numberOfLines={1} className="mt-1 text-[15px] font-bold text-[#F7FBFD]">{analytics.mostCommon}</Text></View>
        <View className="items-end"><Text className="text-[10px] uppercase tracking-wide text-[#8BAABD]">Avg Confidence</Text><Text className="mt-1 text-xl font-bold text-[#55C2E8]">{Math.round(analytics.averageConfidence * 100)}%</Text></View>
      </View>
      <Text className="mb-1.5 mt-3 text-[11px] font-semibold text-[#55C2E8]">Sound Activity</Text>
      <View className="h-10 flex-row items-end gap-1">
        {analytics.activity.map((count, index) => <View key={TIME_BUCKETS[index]} className="flex-1 rounded-t-sm bg-[#40C9F1]" style={{ height: count === 0 ? 2 : Math.max(6, (count / maximum) * 40), opacity: count === 0 ? 0.2 : 0.9 }} />)}
      </View>
      <View className="mt-1 flex-row justify-between"><Text className="text-[9px] text-[#6F93A8]">12 AM</Text><Text className="text-[9px] text-[#6F93A8]">12 PM</Text><Text className="text-[9px] text-[#6F93A8]">Now</Text></View>
    </View>
  );
}
