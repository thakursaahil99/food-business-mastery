import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { ImageStyle } from 'expo-image';

import { brand } from '@/lib/brand';

/** Faded Redbean beans, kept to the edges so the content stays easy to read. */
const BEANS: { style: ImageStyle; size: number; rotate: string; opacity: number }[] = [
  { style: { top: -34, right: -46 }, size: 230, rotate: '24deg', opacity: 0.07 },
  { style: { top: '38%', left: -40 }, size: 120, rotate: '-30deg', opacity: 0.06 },
  { style: { top: '52%', right: -52 }, size: 160, rotate: '14deg', opacity: 0.055 },
  { style: { bottom: 70, left: -30 }, size: 150, rotate: '-14deg', opacity: 0.06 },
  { style: { bottom: -30, right: 40 }, size: 110, rotate: '-34deg', opacity: 0.06 },
];

/**
 * The portal's Classic background: cream with a soft red wash from the top right and a warm gold one from
 * the bottom left (same two-hue wash as the web), plus the faded Redbean bean mark. Sits behind everything.
 */
export function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['rgba(224,20,38,0.10)', 'rgba(224,20,38,0)']} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(245,194,107,0.20)', 'rgba(245,194,107,0)']} start={{ x: 0, y: 1 }} end={{ x: 0.7, y: 0.5 }} style={StyleSheet.absoluteFill} />
      {BEANS.map((b, i) => (
        <Image
          key={i}
          source={require('../../assets/brand/redbean-mark.png')}
          contentFit="contain"
          tintColor={brand.red}
          style={[{ position: 'absolute', width: b.size, height: b.size, opacity: b.opacity, transform: [{ rotate: b.rotate }] }, b.style]}
        />
      ))}
    </View>
  );
}
