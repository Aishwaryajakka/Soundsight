import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioLines, Check, Eye, Settings, Vibrate, Volume2, X } from 'lucide-react-native';
import { useSoundSight } from '@/context/SoundSightContext';
import { ScreenArtwork } from '@/components/ScreenArtwork';
import { SoundDetailModal } from '@/components/SoundDetailModal';
import { SoundIcon } from '@/components/SoundIcon';
import { shouldDisplayAlert } from '@/services/eventAlertPolicy';
import type { SoundEvent } from '@/types/sound';

export default function AlertsScreen() {
  const state = useSoundSight();
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundEvent | null>(null);
  const recentAlerts = state.soundHistory
    .filter((sound) => shouldDisplayAlert(sound.priority))
    .slice(0, 20);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return 'Unknown time';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSeconds < 60) return elapsedSeconds < 2 ? 'Just now' : `${elapsedSeconds}s ago`;
    if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]" edges={['top', 'left', 'right']}>
      <ScreenArtwork source={require('../../../../assets/background-alerts.png')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View className="h-14 flex-row items-center justify-between">
          <Text className="text-[28px] font-bold tracking-tight text-[#F7FBFD]">Alerts</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Open alert preferences" onPress={() => setPreferencesVisible(true)} className="h-11 w-11 items-center justify-center"><Settings size={22} color="#C6E8F5" /></Pressable>
        </View>

        <Text className="mb-2 mt-1 text-[15px] font-semibold text-[#F7FBFD]">Recent Alerts</Text>
        <View className="gap-1.5">
          {recentAlerts.map((sound) => {
            const confidence = Math.round((sound.confidence <= 1 ? sound.confidence : sound.confidence / 100) * 100);
            const critical = sound.priority === 'critical';
            return (
              <Pressable
                key={sound.id}
                accessibilityRole="button"
                accessibilityLabel={`${critical ? 'Critical' : 'High priority'} ${sound.label} detected, ${sound.direction}${state.showConfidence ? `, ${confidence} percent confidence` : ''}`}
                onPress={() => setSelectedSound(sound)}
                className={`min-h-[62px] flex-row items-center rounded-xl border px-2.5 ${critical ? 'border-[#FF7A7E]/55 bg-[#0A3049]' : 'border-[#55C2E8]/35 bg-[#062C45]/90'}`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-[#0A3B59]">
                  <SoundIcon name={sound.iconName} soundType={sound.soundType} size={20} color="#E4F7FD" />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[13px] font-semibold text-[#F7FBFD]">{sound.label} Detected</Text>
                    <Text className={`text-[9px] font-bold uppercase tracking-wide ${critical ? 'text-[#FF9A9D]' : 'text-[#55C2E8]'}`}>{sound.priority}</Text>
                  </View>
                  <Text className="mt-0.5 text-[11px] capitalize text-[#A9C6D8]">
                    {sound.direction.replace('_', ' ')} · {formatTimestamp(sound.timestamp)}
                  </Text>
                </View>
                {state.showConfidence && <Text className="ml-3 text-[15px] font-medium text-[#F7FBFD]">{confidence}%</Text>}
              </Pressable>
            );
          })}
          {recentAlerts.length === 0 && (
            <View className="items-center rounded-xl border border-[#55C2E8]/10 bg-[#062C45]/45 py-6">
              <Text className="text-[13px] text-[#A9C6D8]">No high-priority alerts.</Text>
            </View>
          )}
        </View>

        <View className="relative -mx-4 mt-2 h-[350px] overflow-hidden">
          <View className="absolute inset-x-0 bottom-3 items-center px-10">
            <AudioLines size={31} color="#55C2E8" strokeWidth={2.2} />
            <Text className="mt-3 text-[18px] font-semibold text-[#55C2E8]">Stay Aware</Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-[#C6E8F5]">
              SoundSight helps you notice what&apos;s{`\n`}happening around you, so you can feel{`\n`}more confident and in control.
            </Text>
          </View>
        </View>
      </ScrollView>

      <SoundDetailModal sound={selectedSound} visible={Boolean(selectedSound)} onClose={() => setSelectedSound(null)} />

      <Modal transparent animationType="slide" visible={preferencesVisible} onRequestClose={() => setPreferencesVisible(false)}>
        <View className="flex-1 justify-end bg-[#011827]/80">
          <Pressable className="flex-1" onPress={() => setPreferencesVisible(false)} />
          <View className="max-h-[82%] rounded-t-[28px] bg-[#062C45] px-5 pb-10 pt-4">
            <View className="mb-4 flex-row items-center justify-between"><Text className="text-xl font-bold text-[#F7FBFD]">Alert Preferences</Text><Pressable accessibilityLabel="Close alert preferences" onPress={() => setPreferencesVisible(false)} className="h-10 w-10 items-center justify-center"><X size={20} color="#C6E8F5" /></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-2 text-sm font-semibold text-[#55C2E8]">Alert Methods</Text>
              {[
                { label: 'Visual Strobe', icon: Eye, enabled: state.visualAlertsEnabled, toggle: state.setVisualAlertsEnabled },
                { label: 'Haptic Vibration', icon: Vibrate, enabled: state.hapticAlertsEnabled, toggle: state.setHapticAlertsEnabled },
                { label: 'Spoken Announcements', icon: Volume2, enabled: state.spokenAlertsEnabled, toggle: state.setSpokenAlertsEnabled },
              ].map((item) => <Pressable key={item.label} onPress={() => item.toggle(!item.enabled)} className="h-14 flex-row items-center border-b border-[#55C2E8]/10"><item.icon size={19} color="#55C2E8" /><Text className="ml-3 flex-1 text-[15px] font-medium text-[#F7FBFD]">{item.label}</Text><View className={`h-7 w-12 rounded-full p-1 ${item.enabled ? 'bg-[#55C2E8]' : 'bg-[#6F93A8]'}`}><View className={`h-5 w-5 rounded-full bg-[#021E32] ${item.enabled ? 'translate-x-5' : ''}`} /></View></Pressable>)}
              <Text className="mb-2 mt-6 text-sm font-semibold text-[#55C2E8]">Important Sounds</Text>
              {state.importantSounds.map((sound) => <Pressable key={sound.id} onPress={() => state.toggleImportantSound(sound.id)} className="h-14 flex-row items-center border-b border-[#55C2E8]/10"><SoundIcon name={sound.iconName} soundType={sound.soundType} size={19} color="#C6E8F5" /><Text className="ml-3 flex-1 text-[15px] text-[#F7FBFD]">{sound.name}</Text><View className={`h-6 w-6 items-center justify-center rounded-md border ${sound.enabled ? 'border-[#55C2E8] bg-[#55C2E8]' : 'border-[#6F93A8]'}`}>{sound.enabled && <Check size={14} color="#021E32" />}</View></Pressable>)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
