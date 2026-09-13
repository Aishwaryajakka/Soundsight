import { useEffect } from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type RelativePathString } from 'expo-router';
import { GlacierWave } from '@/components/branding/GlacierWave';

export default function SplashScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const compact = screenHeight < 720;

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/microphone' as RelativePathString), 1800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[58%] bg-[#D7EAF4]" />
      <View pointerEvents="none" className="absolute inset-x-0" style={{ top: screenHeight * 0.24, height: screenHeight * 0.34 }}>
        <Image source={require('../../assets/splash-glacier.png')} resizeMode="stretch" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      </View>
      <View pointerEvents="none" className="absolute inset-x-0" style={{ top: screenHeight * 0.4 }}><GlacierWave height={compact ? 190 : 235} opacity={0.98} /></View>
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0 bg-[#021E32]" style={{ top: screenHeight * 0.56 }} />
      <View pointerEvents="none" className="absolute inset-x-0 bottom-[8%]"><GlacierWave height={compact ? 220 : 285} opacity={0.54} /></View>

      <View className="z-10 items-center" style={{ paddingTop: compact ? 0 : 4 }}>
        <Image source={require('../../assets/SoundSightLogo.png')} resizeMode="contain" style={{ width: compact ? 218 : 238, height: compact ? 218 : 238 }} accessibilityLabel="SoundSight — Sounds reveal more" accessibilityIgnoresInvertColors />
      </View>

      <View className="absolute inset-x-0 bottom-0 z-10 px-7" style={{ height: 190 }}>
        <Text className="absolute left-7 text-[14px] leading-[22px] tracking-[4.5px] text-[#D8EDF6]" style={{ bottom: 62 }}>A MORE{`\n`}ACCESSIBLE{`\n`}WORLD{`\n`}AROUND YOU</Text>
        <View className="absolute inset-x-0 items-center" style={{ bottom: compact ? 10 : 16 }}>
          <View className="h-px w-[122px] bg-[#285B78]"><View className="h-[2px] w-8 bg-[#48C5ED]" /></View>
          <Text className="mt-3 text-[11px] text-[#A9C6D8]">Loading...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
