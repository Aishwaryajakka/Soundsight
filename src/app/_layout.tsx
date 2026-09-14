import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SoundSightProvider, useSoundSight } from '@/context/SoundSightContext';
import { StrobeOverlay } from '@/components/StrobeOverlay';
import '../global.css';
import { preloadBackgroundAssets } from '@/services/backgroundAssets';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

function RootAppContent() {
  const { isStrobeActive, dismissStrobe, feedbackMessage } = useSoundSight();

  return (
    <>
      <StatusBar style="light" backgroundColor="#021E32" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#021E32' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="microphone" />
        <Stack.Screen name="recent" />
        <Stack.Screen name="about" />
        <Stack.Screen name="info/[slug]" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StrobeOverlay active={isStrobeActive} onDismiss={dismissStrobe} />
      {feedbackMessage && (
        <View pointerEvents="none" className="absolute inset-x-4 bottom-24 z-50 items-center">
          <View className="max-w-[360px] rounded-full border border-[#55C2E8]/30 bg-[#073653] px-5 py-3">
            <Text className="text-center text-sm font-semibold text-[#E8F8FD]">{feedbackMessage}</Text>
          </View>
        </View>
      )}
      <PortalHost />
    </>
  );
}

const RootLayout: React.FC = () => {
  useEffect(() => {
    void preloadBackgroundAssets().catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#021E32' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: Platform.OS === 'web' ? 430 : undefined,
          alignSelf: 'center',
          overflow: 'hidden',
          backgroundColor: '#021E32',
        }}
      >
        <SoundSightProvider>
          <RootAppContent />
        </SoundSightProvider>
      </View>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);
