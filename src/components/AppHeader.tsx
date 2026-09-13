import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SoundSightWordmark } from './branding/SoundSightWordmark';

interface AppHeaderProps { listening?: boolean; onToggleListening?: () => void }
export const AppHeader: React.FC<AppHeaderProps> = ({ listening, onToggleListening }) => (
  <View className="h-14 flex-row items-center justify-between">
    <SoundSightWordmark markSize={36} textSize="lg" />
    {typeof listening === 'boolean' && <Pressable accessibilityRole="button" accessibilityLabel={listening ? 'Listening. Tap to pause.' : 'Paused. Tap to listen.'} onPress={onToggleListening} className="h-9 flex-row items-center gap-2 rounded-full border border-[#55C2E8]/35 bg-[#062C45] px-3"><View className={`h-2 w-2 rounded-full ${listening ? 'bg-[#20D6B5]' : 'bg-[#6F93A8]'}`} /><Text className="text-xs font-medium text-[#C6E8F5]">{listening ? 'Listening…' : 'Paused'}</Text></Pressable>}
  </View>
);
