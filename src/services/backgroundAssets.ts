import { Asset } from 'expo-asset';

export const BACKGROUND_ASSETS = {
  about: require('../../assets/background-about-highres.png'),
  alerts: require('../../assets/background-alerts-highres.png'),
  microphone: require('../../assets/background-microphone-highres.png'),
  recent: require('../../assets/background-recent-highres.png'),
  settings: require('../../assets/background-settings-highres.png'),
  splash: require('../../assets/splash-background-final-highres.png'),
} as const;

/** Warm the local asset cache without blocking the initial navy fallback frame. */
export async function preloadBackgroundAssets(): Promise<void> {
  await Promise.all(
    Object.values(BACKGROUND_ASSETS).map((module) =>
      Asset.fromModule(module).downloadAsync()
    )
  );
}
