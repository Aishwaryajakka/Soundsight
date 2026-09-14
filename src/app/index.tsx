import { useCallback, useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter, type RelativePathString } from 'expo-router';
import { BACKGROUND_ASSETS } from '@/services/backgroundAssets';
import { APP_MAX_WIDTH } from '@/constants/navigation';

const backgroundArtwork = BACKGROUND_ASSETS.splash;
const brandArtwork = require('../../assets/SoundSightLogo.png');

export default function LandingScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const canvasHeight = height;
  const canvasWidth = Platform.OS === 'web' ? Math.min(width, APP_MAX_WIDTH) : width;
  const scale = Math.min(canvasWidth / 390, canvasHeight / 844);
  const brandingSize = Math.round(280 * Math.max(0.9, Math.min(scale, 1.08)));
  const progress = useRef(new Animated.Value(0.36)).current;
  const navigationStarted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    if (navigationStarted.current) return;
    navigationStarted.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    router.replace('/microphone' as RelativePathString);
  }, [router]);

  useEffect(() => {
    timer.current = setTimeout(advance, 5_000);
    Animated.timing(progress, { toValue: 1, duration: 5_000, useNativeDriver: false }).start();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      progress.stopAnimation();
    };
  }, [advance, progress]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Continue to microphone access" onPress={advance} style={styles.root}>
      <ImageBackground
        source={backgroundArtwork}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
        accessibilityIgnoresInvertColors
      />

      <View pointerEvents="none" style={[styles.branding, { top: canvasHeight * 0.075 }]}>
        <Image
          source={brandArtwork}
          resizeMode="contain"
          style={{ width: brandingSize, height: brandingSize }}
          accessibilityLabel="SoundSight — Sounds reveal more"
          accessibilityIgnoresInvertColors
        />
      </View>

      <Text
        pointerEvents="none"
        style={[
          styles.mission,
          {
            left: Math.max(32, canvasWidth * 0.082),
            bottom: canvasHeight * 0.145,
          },
        ]}
      >
        A MORE{`\n`}ACCESSIBLE{`\n`}WORLD{`\n`}AROUND YOU
      </Text>

      <View pointerEvents="none" style={[styles.loadingControl, { bottom: canvasHeight * 0.045 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressActive, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#032A43',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  branding: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mission: {
    position: 'absolute',
    color: '#F7FBFD',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 4,
    lineHeight: 24,
  },
  loadingControl: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: 176,
    height: 3,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: 'rgba(4, 51, 77, 0.78)',
  },
  progressActive: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00B9F2',
  },
  loadingText: {
    marginTop: 14,
    color: '#8BAAC4',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
});
