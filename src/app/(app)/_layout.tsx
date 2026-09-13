import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#021E32' },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
