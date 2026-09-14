import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

type ScreenArtworkProps = {
  source: ImageSourcePropType;
  opacity?: number;
};

export function ScreenArtwork({ source, opacity = 1 }: ScreenArtworkProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Image
        accessibilityIgnoresInvertColors
        source={source}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { height: '100%', width: '100%', opacity }]}
      />
    </View>
  );
}
