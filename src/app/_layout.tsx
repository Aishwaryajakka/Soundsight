import React from 'react';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SoundSightProvider, useSoundSight } from '@/context/SoundSightContext';
import { StrobeOverlay } from '@/components/StrobeOverlay';
import '../global.css';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

function RootAppContent() {
  const { isStrobeActive, dismissStrobe } = useSoundSight();

  return (
    <>
      <StatusBar style="light" backgroundColor="#021E32" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#021E32' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="microphone" />
        <Stack.Screen name="recent" />
        <Stack.Screen name="about" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StrobeOverlay active={isStrobeActive} onDismiss={dismissStrobe} />
      <PortalHost />
    </>
  );
}

const RootLayout: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#021E32' }}>
      <SoundSightProvider>
        <RootAppContent />
      </SoundSightProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);
