import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type RelativePathString } from 'expo-router';
import { AudioLines, Bell, Check, ChevronLeft, LockKeyhole, MapPin, UserRound } from 'lucide-react-native';
import { GlacierWave } from '@/components/branding/GlacierWave';
import { SoundSightMark } from '@/components/branding/SoundSightMark';
import { SoundSightWordmark } from '@/components/branding/SoundSightWordmark';

const features = [
  { label: 'Detects important sounds', icon: AudioLines },
  { label: 'Shows you where they happen', icon: MapPin },
  { label: 'Alerts you to what matters', icon: Bell },
  { label: 'Adapts to your environment', icon: UserRound },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const permissionContentWidth = Math.min(screenWidth - 40, 342);
  const [step, setStep] = useState<'splash' | 'microphone'>('splash');
  const [permissionAccepted, setPermissionAccepted] = useState(false);
  const enterApp = () => router.replace('/(app)/(tabs)/home' as RelativePathString);
  const allowMicrophone = () => {
    setPermissionAccepted(true);
    setTimeout(enterApp, 450);
  };

  useEffect(() => {
    if (step !== 'splash') return;
    const timer = setTimeout(() => setStep('microphone'), 1800);
    return () => clearTimeout(timer);
  }, [step]);

  if (step === 'splash') {
    const compactSplash = screenHeight < 720;

    return (
      <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[58%] bg-[#D7EAF4]" />
        <View
          pointerEvents="none"
          className="absolute inset-x-0"
          style={{ top: screenHeight * 0.24, height: screenHeight * 0.34 }}
        >
          <Image
            source={require('../../assets/splash-glacier.png')}
            resizeMode="stretch"
            style={{ width: '100%', height: '100%' }}
            accessibilityIgnoresInvertColors
          />
        </View>
        <View pointerEvents="none" className="absolute inset-x-0" style={{ top: screenHeight * 0.4 }}>
          <GlacierWave height={compactSplash ? 190 : 235} opacity={0.98} />
        </View>
        <View pointerEvents="none" className="absolute inset-x-0 bottom-0 bg-[#021E32]" style={{ top: screenHeight * 0.56 }} />
        <View pointerEvents="none" className="absolute inset-x-0 bottom-[8%]">
          <GlacierWave height={compactSplash ? 220 : 285} opacity={0.54} />
        </View>

        <View className="z-10 items-center" style={{ paddingTop: compactSplash ? 0 : 4 }}>
          <Image
            source={require('../../assets/SoundSightLogo.png')}
            resizeMode="contain"
            style={{ width: compactSplash ? 218 : 238, height: compactSplash ? 218 : 238 }}
            accessibilityLabel="SoundSight — Sounds reveal more"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View className="absolute inset-x-0 bottom-0 z-10 px-7" style={{ height: 190, paddingBottom: compactSplash ? 10 : 16 }}>
          <Text className="absolute left-7 text-[14px] leading-[22px] tracking-[4.5px] text-[#D8EDF6]" style={{ bottom: 62 }}>
            A MORE{`\n`}ACCESSIBLE{`\n`}WORLD{`\n`}AROUND YOU
          </Text>
          <View className="absolute inset-x-0 items-center" style={{ bottom: compactSplash ? 10 : 16 }}>
            <View className="h-px w-[122px] bg-[#285B78]">
              <View className="h-[2px] w-8 bg-[#48C5ED]" />
            </View>
            <Text className="mt-3 text-[11px] text-[#A9C6D8]">Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-[#021E32]">
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
        <GlacierWave height={148} opacity={0.58} />
      </View>

      <Pressable
        accessibilityLabel="Back to welcome"
        onPress={() => setStep('splash')}
        className="absolute left-3 top-1 z-20 h-11 w-11 items-center justify-center"
      >
        <ChevronLeft size={27} color="#C6E8F5" strokeWidth={1.8} />
      </Pressable>

      <ScrollView
        className="z-10 flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View className="items-center">
          <SoundSightMark size={88} />
          <View className="mt-0.5">
            <SoundSightWordmark markSize={0} textSize="xl" />
          </View>
          <Text className="mt-[26px] text-center text-[22px] font-bold leading-[27px] text-[#F7FBFD]">
            Enable Microphone{`\n`}Access
          </Text>
          <Text className="mt-[10px] text-center text-[14px] leading-[20px] text-[#C0D7E4]">
            SoundSight listens for important{`\n`}environmental sounds and shows you{`\n`}where they are around you.
          </Text>
        </View>

        <View className="mx-auto mt-5 gap-0.5 px-2" style={{ width: permissionContentWidth }}>
          {features.map((feature) => (
            <View key={feature.label} className="h-10 flex-row items-center">
              <View className="w-8 items-center">
                <feature.icon size={23} color="#55C2E8" strokeWidth={2.15} />
              </View>
              <Text className="ml-3 text-[14px] text-[#F7FBFD]">{feature.label}</Text>
            </View>
          ))}
        </View>

        <View className="mx-auto mt-5" style={{ width: permissionContentWidth }}>
          <Pressable accessibilityRole="button" onPress={allowMicrophone} className="h-12 flex-row items-center justify-center rounded-2xl bg-[#55C2E8]">
            {permissionAccepted && <Check size={18} color="#021E32" />}
            <Text className="ml-2 text-[15px] font-semibold text-[#021E32]">{permissionAccepted ? 'Microphone Enabled' : 'Allow Microphone Access'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={enterApp} className="mt-[10px] h-11 items-center justify-center rounded-2xl border-[1.5px] border-[#35C8F2]">
            <Text className="text-[14px] font-semibold text-[#48D0F5]">Continue in Demo Mode</Text>
          </Pressable>
          <View className="mt-4 flex-row items-start justify-center px-5">
            <LockKeyhole size={19} color="#7BB7D1" strokeWidth={1.8} />
            <Text className="ml-3 text-[12px] leading-[16px] text-[#A9C6D8]">
              <Text className="font-semibold text-[#C6E8F5]">Your privacy matters.{`\n`}</Text>
              You can change this anytime{`\n`}in Settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
