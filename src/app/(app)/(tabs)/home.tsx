import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type RelativePathString } from 'expo-router';
import {
  ChevronRight,
  Pause,
  MicOff,
} from 'lucide-react-native';
import { useSoundSight } from '@/context/SoundSightContext';
import { SoundRadarCanvas } from '@/components/SoundRadarCanvas';
import { SoundDetailModal } from '@/components/SoundDetailModal';
import { AppHeader } from '@/components/AppHeader';
import { SoundIcon } from '@/components/SoundIcon';
import type { SoundEvent } from '@/types/sound';

export default function MapScreen() {
  const router = useRouter();
  const {
    liveConnectionState,
    isLiveListening,
    setIsLiveListening,
    micPermissionDenied,
    activeSounds,
    selectedSound,
    setSelectedSound,
    soundHistory,
    lastTriggeredSoundId,
    showConfidence,
    showSoundIntensity,
    keepEventsVisibleDuration,
    productMode,
    transcripts,
    transcriptionStatus,
    conversationPaused,
    setConversationPaused,
    clearTranscripts,
    operatingMode,
    clearDemoData,
    mode,
    enterLiveMode,
    enterDemoMode,
    enterConversationMode,
    enableClientMicrophone,
    clientMicrophoneEnabled,
  } = useSoundSight();

  const [modalVisible, setModalVisible] = useState(false);
  const [clearTranscriptConfirmationVisible, setClearTranscriptConfirmationVisible] = useState(false);

  const handleSelectSound = (sound: SoundEvent) => {
    setSelectedSound(sound);
    setModalVisible(true);
  };

  const toggleListening = () => {
    if (operatingMode === 'demo') {
      clearDemoData();
      return;
    }
    setIsLiveListening(!isLiveListening);
  };
  const startConversation = async () => {
    if (!clientMicrophoneEnabled && !await enableClientMicrophone()) return;
    enterConversationMode();
  };
  const switchToLive = async () => {
    if (mode === 'live') return;
    if (!clientMicrophoneEnabled && !await enableClientMicrophone()) return;
    enterLiveMode();
  };

  // Recent sounds list (latest 4)
  const recentSounds = soundHistory.slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-[#021E32]" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Denied Error State Banner */}
        {micPermissionDenied && (
          <View className="mb-3 p-3.5 rounded-2xl bg-[#FF5A5F]/15 border border-[#FF5A5F]/60 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <MicOff size={18} color="#FF5A5F" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-[#F7FBFD]">
                  Microphone Access Required
                </Text>
                <Text className="text-[11px] text-[#C6E8F5]">
                  Sound detection is paused. Grant microphone permission to resume.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => { void enableClientMicrophone(); }}
              className="px-3 py-1.5 rounded-xl bg-[#55C2E8] active:opacity-80"
            >
              <Text className="text-xs font-bold text-[#021E32]">
                Enable
              </Text>
            </Pressable>
          </View>
        )}

        <AppHeader
          listening={isLiveListening}
          operatingMode={operatingMode}
          connectionState={liveConnectionState}
          onToggleListening={toggleListening}
        />

        <View className="mb-2 mt-1 h-9 flex-row self-end rounded-xl border border-[#55C2E8]/20 bg-[#062C45] p-1">
          <Pressable accessibilityRole="button" accessibilityState={{ selected: operatingMode === 'live' }} accessibilityLabel="Use Live Mode" onPress={() => { void switchToLive(); }} className={`min-w-[64px] items-center justify-center rounded-lg px-3 ${operatingMode === 'live' ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-[12px] font-semibold ${operatingMode === 'live' ? 'text-[#021E32]' : 'text-[#A9C6D8]'}`}>Live</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: operatingMode === 'demo' }} accessibilityLabel="Use Demo Mode" onPress={enterDemoMode} className={`min-w-[64px] items-center justify-center rounded-lg px-3 ${operatingMode === 'demo' ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-[12px] font-semibold ${operatingMode === 'demo' ? 'text-[#021E32]' : 'text-[#A9C6D8]'}`}>Demo</Text></Pressable>
        </View>

        <View className="mb-2 h-10 flex-row rounded-xl border border-[#55C2E8]/20 bg-[#062C45] p-1">
          <Pressable onPress={enterLiveMode} className={`flex-1 items-center justify-center rounded-lg ${mode !== 'conversation' ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-[13px] font-semibold ${mode !== 'conversation' ? 'text-[#021E32]' : 'text-[#A9C6D8]'}`}>Awareness</Text></Pressable>
          <Pressable onPress={() => { void startConversation(); }} className={`flex-1 items-center justify-center rounded-lg ${mode === 'conversation' ? 'bg-[#55C2E8]' : ''}`}><Text className={`text-[13px] font-semibold ${mode === 'conversation' ? 'text-[#021E32]' : 'text-[#A9C6D8]'}`}>Conversation</Text></Pressable>
        </View>

        {productMode === 'awareness' ? <>

        {/* 2. HERO SPATIAL SOUND MAP */}
        <View className="relative my-1 items-center justify-center">
          <SoundRadarCanvas
            sounds={isLiveListening || operatingMode === 'demo' ? activeSounds : []}
            selectedSound={selectedSound}
            onSelectSound={handleSelectSound}
            isListening={isLiveListening}
            lastTriggeredSoundId={lastTriggeredSoundId}
            showConfidence={showConfidence}
            showIntensity={showSoundIntensity}
            durationSecs={keepEventsVisibleDuration === '5s' ? 5 : keepEventsVisibleDuration === '20s' ? 20 : 10}
          />

          {/* Listening Paused Subtle Banner */}
          {!isLiveListening && operatingMode !== 'demo' && (
            <View className="absolute inset-0 bg-[#021E32]/80 rounded-full items-center justify-center p-6 border border-[#164E72]/50">
              <View className="w-11 h-11 rounded-full bg-[#062C45] border border-[#247CA8] items-center justify-center mb-2">
                <Pause size={20} color="#55C2E8" />
              </View>
              <Text className="text-sm font-semibold text-[#F7FBFD] text-center">
                Listening Paused
              </Text>
              <Text className="text-xs text-[#C6E8F5] text-center mt-0.5 max-w-[200px]">
                Tap status pill above to resume 360° detection.
              </Text>
            </View>
          )}

          {/* Ambient Quiet Environment Indicator */}
          {(isLiveListening || operatingMode === 'demo') && activeSounds.length === 0 && (
            <View className="absolute bottom-5 bg-[#062C45]/80 px-3.5 py-1.5 rounded-full border border-[#164E72]/80">
              <Text className="text-xs font-medium text-[#C6E8F5]">
                Quiet Environment • No Active Sounds
              </Text>
            </View>
          )}
        </View>

        {/* 3. RECENT SOUNDS */}
        <View className="mt-1 rounded-2xl border border-[#55C2E8]/15 bg-[#062C45]/75 p-2.5">
          <View className="mb-2 flex-row items-center justify-between px-0.5">
            <Text className="text-[16px] font-semibold text-[#F7FBFD]">
              Recent Sounds
            </Text>
            <Pressable
              onPress={() => router.push('/recent' as RelativePathString)}
              className="flex-row items-center gap-0.5 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-[#55C2E8]">
                See all
              </Text>
              <ChevronRight size={14} color="#55C2E8" />
            </Pressable>
          </View>

          {recentSounds.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-sm text-[#C6E8F5]">No recent sounds.</Text>
            </View>
          ) : (
            <View>
              {recentSounds.map((item, index) => {
                const confidence = Math.round((item.confidence <= 1 ? item.confidence : item.confidence / 100) * 100);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label}, ${item.direction}${showConfidence ? `, ${confidence} percent confidence` : ''}`}
                    onPress={() => handleSelectSound(item)}
                    className={`h-[54px] flex-row items-center rounded-xl border border-[#55C2E8]/10 bg-[#082B43]/90 px-2 ${index > 0 ? 'mt-1.5' : ''}`}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#0B3B59]">
                      <SoundIcon name={item.iconName} soundType={item.soundType} size={18} color="#D8F3FC" />
                    </View>
                    <View className="ml-2.5 flex-1">
                      <Text className="text-[13px] font-semibold text-[#F7FBFD]">{item.label}</Text>
                      <Text className="mt-0.5 text-[11px] capitalize text-[#9FC2D5]">{item.direction.replace('_', ' ')} · {item.timeAgo || 'Recent'}</Text>
                    </View>
                    {showConfidence && <Text className="ml-2 text-[14px] font-medium text-[#F7FBFD]">{confidence}%</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        </> : <View className="min-h-[570px]">
          <View className="mt-3 flex-row items-center justify-between"><Text className="text-2xl font-bold text-[#F7FBFD]">Conversation Mode</Text><View className="rounded-full border border-[#55C2E8]/25 bg-[#062C45] px-3 py-1.5"><Text className="text-xs font-semibold capitalize text-[#55C2E8]">{conversationPaused ? 'Paused' : transcriptionStatus}</Text></View></View>
          <Text className="mb-3 mt-7 text-[13px] font-bold tracking-[2px] text-[#55C2E8]">LIVE CAPTIONS</Text>
          <ScrollView className="h-[330px] rounded-2xl border border-[#55C2E8]/15 bg-[#062C45]/85 p-4" nestedScrollEnabled>
            {transcripts.length === 0 ? <View className="h-[285px] items-center justify-center"><Text className="text-center text-base font-semibold text-[#C6E8F5]">Start a conversation to see live captions.</Text></View> : transcripts.slice(-8).map((segment, index, visible) => <View key={segment.id} className={`${index > 0 ? 'mt-5' : ''}`}><Text className={`${index === visible.length - 1 ? 'text-[22px] font-semibold leading-8 text-[#F7FBFD]' : 'text-[16px] leading-6 text-[#8BAABD]'}`}>{segment.text}</Text></View>)}
          </ScrollView>
          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={() => setConversationPaused(!conversationPaused)} className="h-11 flex-1 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#C6E8F5]">{conversationPaused ? 'Resume' : 'Pause'}</Text></Pressable>
            <Pressable onPress={() => setClearTranscriptConfirmationVisible(true)} className="h-11 flex-1 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#C6E8F5]">Clear</Text></Pressable>
            <Pressable onPress={enterLiveMode} className="h-11 flex-[1.35] items-center justify-center rounded-xl bg-[#55C2E8]"><Text className="text-sm font-bold text-[#021E32]">End Conversation</Text></Pressable>
          </View>
          <Text className="mt-5 text-center text-[11px] leading-4 text-[#8BAABD]">Transcripts stay on this device and are automatically deleted after 7 days.</Text>
        </View>}
      </ScrollView>

      {/* Sound Detail Modal */}
      <SoundDetailModal
        sound={selectedSound}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <Modal transparent animationType="fade" visible={clearTranscriptConfirmationVisible} onRequestClose={() => setClearTranscriptConfirmationVisible(false)}><View className="flex-1 items-center justify-center bg-[#011827]/85 px-6"><View className="w-full max-w-[360px] rounded-2xl border border-[#55C2E8]/20 bg-[#062C45] p-5"><Text className="text-lg font-bold text-[#F7FBFD]">Clear conversation transcripts?</Text><Text className="mt-2 text-[13px] leading-5 text-[#A9C6D8]">This removes all locally stored caption text.</Text><View className="mt-5 flex-row gap-3"><Pressable onPress={() => setClearTranscriptConfirmationVisible(false)} className="h-11 flex-1 items-center justify-center rounded-xl border border-[#55C2E8]/30"><Text className="text-sm font-semibold text-[#C6E8F5]">Cancel</Text></Pressable><Pressable onPress={() => { setClearTranscriptConfirmationVisible(false); clearTranscripts(); }} className="h-11 flex-1 items-center justify-center rounded-xl bg-[#55C2E8]"><Text className="text-sm font-bold text-[#021E32]">Clear</Text></Pressable></View></View></View></Modal>
    </SafeAreaView>
  );
}
