import type React from 'react';
import { Text, View } from 'react-native';
import { SoundSightMark } from './SoundSightMark';

export interface SoundSightWordmarkProps { markSize?: number; textSize?: 'sm' | 'md' | 'lg' | 'xl'; variant?: 'dark' | 'light'; showTagline?: boolean; className?: string }
const sizes = { sm: 18, md: 20, lg: 22, xl: 30 } as const;

export const SoundSightWordmark: React.FC<SoundSightWordmarkProps> = ({ markSize = 36, textSize = 'lg', variant = 'dark', showTagline = false, className = '' }) => (
  <View className={`flex-row items-center ${markSize > 0 ? 'gap-2.5' : ''} ${className}`}>
    {markSize > 0 && <SoundSightMark size={markSize} />}
    <View>
      <Text style={{ fontSize: sizes[textSize], lineHeight: sizes[textSize] + 3, fontWeight: '700', letterSpacing: -0.45 }}><Text style={{ color: variant === 'dark' ? '#F7FBFD' : '#021E32' }}>Sound</Text><Text style={{ color: '#55C2E8' }}>Sight</Text></Text>
      {showTagline && <Text className="mt-1 text-[10px] tracking-[3px] text-[#C6E8F5]">SOUNDS REVEAL MORE</Text>}
    </View>
  </View>
);
