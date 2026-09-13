import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import {
  X,
  Compass,
  Activity,
  Volume2,
} from 'lucide-react-native';
import { SoundEvent } from '@/types/sound';
import { SoundIcon } from '@/components/SoundIcon';
import { CATEGORY_META } from '@/constants/theme';
import { soundEventService } from '@/services/soundEventService';
import Svg, { Path } from 'react-native-svg';

interface SoundDetailModalProps {
  sound: SoundEvent | null;
  visible: boolean;
  onClose: () => void;
}

export const SoundDetailModal: React.FC<SoundDetailModalProps> = ({
  sound,
  visible,
  onClose,
}) => {
  if (!sound) return null;

  const category = sound.category || soundEventService.getSoundTypeCategory(sound.soundType);
  const categoryInfo = CATEGORY_META[category] || CATEGORY_META.household;
  const isCritical = sound.priority === 'critical';
  const confidencePct = Math.round(sound.confidence <= 1 ? sound.confidence * 100 : sound.confidence);
  const soundAngle = sound.angle ?? soundEventService.directionToAngle(sound.direction);
  const displayDecibels = sound.decibels ?? Math.round(40 + (sound.intensity <= 1 ? sound.intensity : sound.intensity / 100) * 60);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
        <View className="flex-1 justify-end bg-[#011827]/80">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View className="bg-[#073653] rounded-t-[28px] px-5 pt-3 pb-10">
          {/* Grab handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1 rounded-full bg-[#1E6E9A]" />
          </View>

          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  isCritical
                    ? 'bg-[#0E496F]'
                    : 'bg-[#062C45]'
                }`}
              >
                <SoundIcon
                  name={sound.iconName}
                  soundType={sound.soundType}
                  size={22}
                  color={isCritical ? '#FF5A5F' : '#55C2E8'}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-[#F7FBFD]">{sound.label}</Text>
                  {isCritical && (
                    <View className="bg-[#FF5A5F] px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-[#FFFFFF]">
                        High Priority
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: categoryInfo.bgColor }}
                  >
                    <Text
                      className="text-[11px] font-semibold"
                      style={{ color: categoryInfo.color }}
                    >
                      {categoryInfo.shortLabel}
                    </Text>
                  </View>
                  <Text className="text-xs text-[#C6E8F5]">
                    {sound.timeAgo || 'Detected live'}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Close sound details"
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-[#062C45] border border-[#164E72] items-center justify-center active:opacity-75"
            >
              <X size={18} color="#C6E8F5" />
            </Pressable>
          </View>

          <View className="mb-5">
            <Text className="text-sm text-[#C6E8F5] leading-5">
              {sound.description || `Acoustic detection of ${sound.label.toLowerCase()} in your vicinity.`}
            </Text>
          </View>

          <View className="flex-row py-4 border-y border-[#55C2E8]/15 mb-5">
            {/* Direction */}
            <View className="flex-1 items-center">
              <Compass size={18} color="#55C2E8" />
              <Text className="text-[11px] font-semibold text-[#C6E8F5] mt-1">
                Direction
              </Text>
              <Text className="text-sm font-bold text-[#F7FBFD] capitalize">
                {sound.direction} ({soundAngle}°)
              </Text>
            </View>

            {/* Confidence */}
            <View className="flex-1 items-center border-x border-[#55C2E8]/15">
              <Activity size={18} color="#55C2E8" />
              <Text className="text-[11px] font-semibold text-[#C6E8F5] mt-1">
                Confidence
              </Text>
              <Text className="text-sm font-bold text-[#55C2E8] font-mono">
                {confidencePct}%
              </Text>
            </View>

            {/* Sound Level (dB) */}
            <View className="flex-1 items-center">
              <Volume2 size={18} color="#55C2E8" />
              <Text className="text-[11px] font-semibold text-[#C6E8F5] mt-1">
                Acoustic
              </Text>
              <Text className="text-sm font-bold text-[#F7FBFD]">
                {displayDecibels} dB
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-[#C6E8F5]">
                Topographic Frequency Contour
              </Text>
              <Text className="text-xs font-mono text-[#55C2E8] font-bold">
                {sound.frequencyHz ? `${sound.frequencyHz} Hz` : 'Multi-band'}
              </Text>
            </View>

            <Svg width="100%" height={64} viewBox="0 0 320 64">
              <Path d="M0 55 C44 42 62 12 104 25 S166 63 208 34 S273 12 320 28" fill="none" stroke="#55C2E8" strokeWidth="2" />
              <Path d="M0 62 C42 50 68 22 108 34 S166 68 214 44 S276 23 320 39" fill="none" stroke="#247CA8" strokeWidth="1.5" opacity={0.72} />
              <Path d="M0 45 C44 31 58 4 99 16 S166 53 205 23 S268 2 320 18" fill="none" stroke="#C6E8F5" strokeWidth="1" opacity={0.48} />
            </Svg>
          </View>

          {/* Action Button (48px height) */}
          <Pressable accessibilityRole="button" accessibilityLabel="Acknowledge and close sound details"
            onPress={onClose}
            className="w-full h-12 bg-[#55C2E8] rounded-xl items-center justify-center active:opacity-85"
          >
            <Text className="text-[#021E32] font-bold text-sm">
              Acknowledge & Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
