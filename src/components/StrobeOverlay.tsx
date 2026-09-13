import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ShieldAlert } from 'lucide-react-native';

interface StrobeOverlayProps {
  active: boolean;
  onDismiss: () => void;
}

export const StrobeOverlay: React.FC<StrobeOverlayProps> = ({ active, onDismiss }) => {
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 160 }),
          withTiming(0.2, { duration: 160 })
        ),
        8,
        true
      );
    } else {
      borderOpacity.value = 0;
    }
  }, [active, borderOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  if (!active) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 z-50 justify-between items-center p-4"
    >
      {/* Flashing perimeter glacier ice-cyan border for peripheral vision alert */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: 6,
            borderColor: '#55C2E8',
            backgroundColor: 'rgba(85, 194, 232, 0.18)',
          },
          animatedStyle,
        ]}
      />

      {/* Floating Critical Alert Banner */}
      <View className="bg-[#062C45] border-2 border-[#55C2E8] w-full rounded-2xl p-4 flex-row items-center justify-between shadow-2xl mt-10">
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          <View className="w-10 h-10 rounded-xl bg-[#062C45] border border-[#55C2E8] items-center justify-center shadow-md">
            <ShieldAlert size={22} color="#55C2E8" />
          </View>
          <View className="flex-1">
            <Text className="text-[#F7FBFD] font-extrabold text-sm tracking-wide">
              CRITICAL SOUND DETECTED
            </Text>
            <Text className="text-[#C6E8F5] text-xs font-medium">
              High urgency acoustic event in your surroundings.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onDismiss}
          className="bg-[#55C2E8] px-3.5 py-2 rounded-xl active:opacity-80"
        >
          <Text className="text-[#021E32] font-extrabold text-xs">DISMISS</Text>
        </Pressable>
      </View>
    </View>
  );
};
