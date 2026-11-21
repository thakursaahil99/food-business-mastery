import { memo } from 'react';

import { ICON_XML, type IconName } from './icon-data';

export type { IconName };

/** Browser build: the same inline SVG, placed straight in the page (react-native-svg is only needed on phones). */
export const Icon = memo(function Icon({ name, size = 24, color = '#000' }: { name: IconName; size?: number; color?: string }) {
  return (
    <span
      aria-hidden
      style={{ display: 'inline-flex', width: size, height: size, color, flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: ICON_XML[name].replace('<svg', '<svg width="100%" height="100%"') }}
    />
  );
});
