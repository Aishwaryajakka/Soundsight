import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

type ScreenArtworkProps = {
  source: ImageSourcePropType;
  opacity?: number;
};

export function ScreenArtwork({ source, opacity = 1 }: ScreenArtworkProps) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image
        accessibilityIgnoresInvertColors
        source={source}
        resizeMode="cover"
        style={[styles.image, { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#032A43',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
