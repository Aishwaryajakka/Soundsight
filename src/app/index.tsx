import { Image, ImageBackground, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter, type RelativePathString } from 'expo-router';
import { BACKGROUND_ASSETS } from '@/services/backgroundAssets';

const backgroundArtwork = BACKGROUND_ASSETS.splash;
const brandArtwork = require('../../assets/SoundSightLogo.png');

export default function LandingScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const canvasHeight = Platform.OS === 'web' ? Math.min(height, 900) : height;
  const scale = Math.min(width / 390, canvasHeight / 844);
  const brandingSize = Math.round(280 * Math.max(0.9, Math.min(scale, 1.08)));

  return (
    <View style={[styles.root, { maxHeight: canvasHeight, marginTop: Platform.OS === 'web' ? Math.max(0, (height - canvasHeight) / 2) : 0 }]}>
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
            left: Math.max(32, width * 0.082),
            bottom: canvasHeight * 0.145,
          },
        ]}
      >
        A MORE{`\n`}ACCESSIBLE{`\n`}WORLD{`\n`}AROUND YOU
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter SoundSight"
        onPress={() => router.push('/microphone' as RelativePathString)}
        style={[styles.loadingControl, { bottom: canvasHeight * 0.045 }]}
      >
        <View style={styles.progressTrack}>
          <View style={styles.progressActive} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </Pressable>
    </View>
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
    width: '36%',
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
