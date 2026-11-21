import { memo } from 'react';
import { SvgXml } from 'react-native-svg';

import { ICON_XML, type IconName } from './icon-data';

export type { IconName };

/**
 * App icon drawn as an inline SVG. Unlike icon fonts there is nothing to download, so it shows on
 * every phone, including Expo Go over a slow or tunnelled connection.
 */
export const Icon = memo(function Icon({ name, size = 24, color = '#000' }: { name: IconName; size?: number; color?: string }) {
  return <SvgXml xml={ICON_XML[name]} width={size} height={size} color={color} />;
});
