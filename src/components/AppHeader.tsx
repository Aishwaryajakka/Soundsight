import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import type { LiveSoundConnectionState } from '@/services/liveSoundEventService';
import { SoundSightWordmark } from './branding/SoundSightWordmark';

interface AppHeaderProps {
  operatingMode?: 'live' | 'demo';
  listening?: boolean;
  connectionState?: LiveSoundConnectionState;
  onToggleListening?: () => void;
  onLogoPress?: () => void;
}

const statusPresentation = (state: LiveSoundConnectionState) => {
  switch (state) {
    case 'connected':
      return { label: 'Listening', accessibilityLabel: 'Live AI connected. Listening.' };
    case 'connecting':
      return { label: 'Connecting', accessibilityLabel: 'Connecting to live AI.' };
    case 'error':
      return { label: 'AI Offline', accessibilityLabel: 'Live AI is offline. Demo Mode is available.' };
    default:
      return { label: 'AI Offline', accessibilityLabel: 'Live AI disconnected. Reconnection will be attempted.' };
  }
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  listening,
  operatingMode = 'live',
  connectionState,
  onToggleListening,
  onLogoPress,
}) => {
  const status = operatingMode === 'demo'
    ? { label: 'Demo Mode', accessibilityLabel: 'Demo mode. Showing deterministic sample data.' }
    : connectionState ? statusPresentation(connectionState) : null;
  const label = status?.label ?? (listening ? 'Listening…' : 'Paused');
  const accessibilityLabel = status?.accessibilityLabel ??
    (listening ? 'Listening. Tap to pause.' : 'Paused. Tap to listen.');

  return (
    <View className="h-14 flex-row items-center justify-between">
      {onLogoPress ? <Pressable accessibilityRole="button" accessibilityLabel="Go to SoundSight map" onPress={onLogoPress}><SoundSightWordmark markSize={36} textSize="lg" variant="dark" /></Pressable> : <SoundSightWordmark markSize={36} textSize="lg" variant="dark" />}
      {typeof listening === 'boolean' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onToggleListening}
          className="h-9 flex-row items-center gap-2 rounded-full border border-[#55C2E8]/35 bg-[#062C45] px-3"
        >
          {connectionState === 'error' ? (
            <AlertTriangle size={12} color="#F1B85B" strokeWidth={2.2} />
          ) : (
            <View
              className={`h-2 w-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-[#20D6B5]'
                  : connectionState === 'connecting'
                    ? 'border border-[#55C2E8]'
                    : 'border border-[#6F93A8]'
              }`}
            />
          )}
          <Text className="text-xs font-medium text-[#C6E8F5]">{label}</Text>
        </Pressable>
      )}
    </View>
  );
};
