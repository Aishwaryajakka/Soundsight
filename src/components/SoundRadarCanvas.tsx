import type React from 'react';
import { useEffect } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { User } from 'lucide-react-native';
import type { SoundEvent } from '@/types/sound';
import { SoundIcon } from '@/components/SoundIcon';
import { soundEventService } from '@/services/soundEventService';

interface SoundRadarCanvasProps {
  sounds: SoundEvent[];
  selectedSound: SoundEvent | null;
  onSelectSound: (sound: SoundEvent) => void;
  isListening?: boolean;
  lastTriggeredSoundId?: string | null;
  showConfidence?: boolean;
  showIntensity?: boolean;
  durationSecs?: number;
}

const contourPath = (cx: number, cy: number, radius: number, seed: number) => {
  const points = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const wobble = 1 + Math.sin(index * 2.1 + seed) * 0.1 + Math.cos(index * 1.35 + seed) * 0.06;
    return [cx + Math.cos(angle) * radius * wobble, cy + Math.sin(angle) * radius * wobble] as const;
  });
  const mid = (a: readonly number[], b: readonly number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const firstMid = mid(points[11], points[0]);
  let d = `M ${firstMid[0]} ${firstMid[1]}`;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const nextMid = mid(point, next);
    d += ` Q ${point[0]} ${point[1]} ${nextMid[0]} ${nextMid[1]}`;
  });
  return `${d} Z`;
};

const BEARING_SPOKES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] as const;

export const SoundRadarCanvas: React.FC<SoundRadarCanvasProps> = ({
  sounds,
  selectedSound,
  onSelectSound,
  isListening = true,
  showConfidence = true,
  showIntensity = true,
  durationSecs = 10,
}) => {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // Responsive sizing: hero map taking ~50-55% of available viewport width/height
  const availableDimension = Math.min(width - 40, height * 0.48, 380);
  const size = Math.max(260, availableDimension);
  const center = size / 2;
  const radius = center - 20; // Preserve room for cardinal labels while maximizing the radar.

  // Ambient gentle topographic pulse
  const ambientPulse1 = useSharedValue(0.7);
  const ambientPulse2 = useSharedValue(0.4);

  useEffect(() => {
    if (isListening && !reduceMotion) {
      ambientPulse1.value = withRepeat(
        withTiming(1.08, { duration: 3400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      ambientPulse2.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2000, easing: Easing.out(Easing.quad) }),
          withTiming(0.4, { duration: 2000, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );
    }
  }, [isListening, reduceMotion, ambientPulse1, ambientPulse2]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ambientPulse1.value }],
    opacity: isListening ? ambientPulse2.value : 0.2,
  }));

  // 3 subtle concentric rings maximum (clean topographic reference)
  const topographicRings = [
    radius * 0.35,
    radius * 0.68,
    radius * 0.98,
  ];

  // Mathematical radius for directional labels (all precisely on same circle)
  const labelRadius = radius * 0.98;

  return (
    <View
      className="items-center justify-center my-1 relative self-center"
      style={{ width: size, height: size }}
    >
      {/* Dynamic Background SVG Topographic Map & Contour Waves */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
      >
        <Defs>
          {/* Topographic Background Deep Glacier Gradient */}
          <RadialGradient id="topoMapBg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#062C45" stopOpacity="0.4" />
            <Stop offset="65%" stopColor="#042C46" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#021E32" stopOpacity="0.95" />
          </RadialGradient>

        </Defs>

        {/* Outer Circular Boundary */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#topoMapBg)"
            stroke="#2380AC"
          strokeWidth="1.2"
        />

        {/* 3 Subtle Concentric Topographic Rings (No Grid Clutter) */}
        {topographicRings.map((r, i) => (
          <Circle
            key={`topo-ring-${r}`}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#1E6E9A"
            strokeWidth={i === topographicRings.length - 1 ? '1.1' : '0.75'}
            opacity={0.25 + i * 0.13}
          />
        ))}

        {/* Faint bearing spokes visible in the supplied radar reference. */}
        {BEARING_SPOKES.map((degrees) => {
          const angle = (degrees / 180) * Math.PI;
          return (
            <Path
              key={`bearing-${degrees}`}
              d={`M ${center} ${center} L ${center + Math.cos(angle) * radius} ${center + Math.sin(angle) * radius}`}
              stroke="#2380AC"
              strokeWidth="0.65"
              opacity={0.22}
            />
          );
        })}

        {/* Mathematical Cardinal Axis Markers */}
        <Path
          d={`M ${center} ${center - radius} L ${center} ${center - radius + 8} M ${center} ${center + radius - 8} L ${center} ${center + radius} M ${center - radius} ${center} L ${center - radius + 8} ${center} M ${center + radius - 8} ${center} L ${center + radius} ${center}`}
          stroke="#55C2E8"
          strokeWidth="1.5"
          opacity={0.6}
        />

        {/* Layered Topographic Contour Sound Waves (4-6 flowing layers per detection) */}
        {sounds.map((sound) => {
          const soundAngle = sound.angle ?? soundEventService.directionToAngle(sound.direction);
          const rad = ((soundAngle - 90) * Math.PI) / 180;
          const targetDist = radius * 0.62;
          const targetX = center + targetDist * Math.cos(rad);
          const targetY = center + targetDist * Math.sin(rad);

          // Age factor decay calculation
          const now = Date.now();
          const ageSecs = Math.max(0, (now - sound.timestamp) / 1000);
          const ageFactor = Math.max(0.35, Math.exp(-ageSecs / Math.max(8, durationSecs * 2)));

          const isCritical = sound.priority === 'critical' || sound.soundType === 'alarm';
          const confNorm = sound.confidence <= 1 ? sound.confidence : sound.confidence / 100;
          const lobeSize = 28 + confNorm * 18;

          // Draw outer-to-inner so translucent glacier layers build visible depth.
          const contourLayers = [
            { radius: lobeSize * 1.48, opacity: 0.12 },
            { radius: lobeSize * 1.24, opacity: 0.17 },
            { radius: lobeSize, opacity: 0.23 },
            { radius: lobeSize * 0.76, opacity: 0.31 },
            { radius: lobeSize * 0.52, opacity: 0.42 },
          ];

          return (
            <G key={`contour-waves-${sound.id}`}>
              {/* Irregular glacier contours: confidence controls clarity, intensity controls scale. */}
              {showIntensity && contourLayers.map((layer, idx) => {
                const clarity = (0.45 + confNorm * 0.55) * ageFactor;
                return (
                  <Path
                    key={`${sound.id}-contour-${layer.radius}`}
                    d={contourPath(targetX, targetY, layer.radius * (0.82 + sound.intensity * 0.34), idx + soundAngle / 30)}
                    fill={isCritical ? '#C6E8F5' : idx > 2 ? '#55C2E8' : '#247CA8'}
                    fillOpacity={layer.opacity * clarity}
                    stroke={isCritical ? '#F7FBFD' : '#55C2E8'}
                    strokeWidth={idx === contourLayers.length - 1 ? '1.4' : '0.9'}
                    strokeOpacity={(0.22 + idx * 0.14) * clarity}
                  />
                );
              })}

            </G>
          );
        })}
      </Svg>

      {/* Subtle Animated Breathing Ring */}
      {isListening && !reduceMotion && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: radius * 1.35,
              height: radius * 1.35,
              borderRadius: (radius * 1.35) / 2,
              borderColor: '#55C2E8',
              borderWidth: 1,
            },
            animatedRingStyle,
          ]}
        />
      )}

      {/* MATHEMATICALLY SYMMETRICAL DIRECTIONAL LABELS (12, 3, 6, 9 O'CLOCK) */}
      {/* FRONT (12 o'clock) */}
      <View
        className="absolute items-center pointer-events-none"
        style={{ top: center - labelRadius - 10, left: center - 24, width: 48 }}
      >
        <Text className="text-[11px] font-black tracking-widest text-[#C6E8F5] text-center">
          FRONT
        </Text>
      </View>

      {/* BACK (6 o'clock) */}
      <View
        className="absolute items-center pointer-events-none"
        style={{ top: center + labelRadius - 6, left: center - 24, width: 48 }}
      >
        <Text className="text-[11px] font-black tracking-widest text-[#C6E8F5] text-center">
          BACK
        </Text>
      </View>

      {/* LEFT (9 o'clock) */}
      <View
        className="absolute items-center pointer-events-none"
        style={{ top: center - 8, left: center - labelRadius - 20, width: 40 }}
      >
        <Text className="text-[11px] font-black tracking-widest text-[#C6E8F5] text-center">
          LEFT
        </Text>
      </View>

      {/* RIGHT (3 o'clock) */}
      <View
        className="absolute items-center pointer-events-none"
        style={{ top: center - 8, left: center + labelRadius - 20, width: 40 }}
      >
        <Text className="text-[11px] font-black tracking-widest text-[#C6E8F5] text-center">
          RIGHT
        </Text>
      </View>

      {/* CENTER: User Position with Symmetrical Geometry */}
      <View className="z-20 h-[54px] w-[54px] items-center justify-center rounded-full border-[1.5px] border-[#55C2E8] bg-[#03263D]">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-[#0A3D5A]">
          <User size={16} color="#9AE1F6" />
        </View>
        <Text className="text-[8px] font-black tracking-widest text-[#F7FBFD]">
          YOU
        </Text>
      </View>

      {/* SOUND MARKERS: Clean, Standardized [Icon, Name, Confidence] */}
      {sounds.map((sound) => {
        const soundAngle = sound.angle ?? soundEventService.directionToAngle(sound.direction);
        const rad = ((soundAngle - 90) * Math.PI) / 180;
        const targetDist = radius * 0.62;
        const nodeX = center + targetDist * Math.cos(rad) - 48;
        const nodeY = center + targetDist * Math.sin(rad) - 28;
        const isSelected = selectedSound?.id === sound.id;
        const isCritical = sound.priority === 'critical' || sound.soundType === 'alarm';

        const now = Date.now();
        const ageSecs = Math.max(0, (now - sound.timestamp) / 1000);
        const nodeOpacity = Math.max(0.65, Math.exp(-ageSecs / Math.max(12, durationSecs * 2.5)));
        const confidencePct = Math.round(sound.confidence <= 1 ? sound.confidence * 100 : sound.confidence);

        return (
          <Pressable
            key={sound.id}
            onPress={() => onSelectSound(sound)}
            className="absolute items-center z-30 active:scale-95 transition-transform"
            style={{
              left: nodeX,
              top: nodeY,
              width: 96,
              opacity: nodeOpacity,
            }}
          >
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${
                isCritical
                  ? 'bg-[#C6E8F5]/15'
                  : isSelected
                  ? 'bg-[#55C2E8]/25 scale-105'
                  : 'bg-transparent'
              }`}
            >
              <SoundIcon
                name={sound.iconName}
                soundType={sound.soundType}
                size={18}
                color={isCritical ? '#F7FBFD' : '#55C2E8'}
              />
            </View>

            <View className="mt-0.5 max-w-[96px] items-center px-1">
              <Text
                className="text-center text-[11px] font-semibold leading-[14px] text-[#F7FBFD]"
              >
                {sound.label}
              </Text>
              {showConfidence && (
                <Text className="text-[10px] font-semibold text-[#D7EFF8]">
                  {confidencePct}%
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
