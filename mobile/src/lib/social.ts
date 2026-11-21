import { SUPPORT_PHONE } from './config';

/**
 * Redbean's own profiles (taken from redbeanhospitality.com and bobbysingh.in) with each network's
 * official brand colour. Instagram uses its gradient, so it carries a list of stops.
 */
export type SocialLink = {
  id: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'x' | 'whatsapp';
  label: string;
  /** Inline SVG logo (src/components/icon-data.ts) */
  icon: 'logo-instagram' | 'logo-facebook' | 'logo-youtube' | 'logo-linkedin' | 'logo-x' | 'logo-whatsapp';
  url: string;
  /** Official brand colour, used as the button background. */
  color: string;
  /** Instagram: its official gradient, drawn bottom-left to top-right. */
  gradient?: readonly [string, string, ...string[]];
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    url: 'https://www.instagram.com/redbean_hospitality/',
    color: '#E4405F',
    gradient: ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'],
  },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', url: 'https://www.facebook.com/Redbean-Hospitality-279167399278973/', color: '#1877F2' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube', url: 'https://www.youtube.com/channel/UC1f6QYMt07etGr822a0I2Gw', color: '#FF0000' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', url: 'https://www.linkedin.com/company/red-bean-hospitality/', color: '#0A66C2' },
  { id: 'x', label: 'X', icon: 'logo-x', url: 'https://x.com/redbeanhospital', color: '#000000' },
];

/** WhatsApp joins the list once the real helpline number is set (EXPO_PUBLIC_SUPPORT_PHONE). */
export const SOCIALS: SocialLink[] = SUPPORT_PHONE
  ? [...SOCIAL_LINKS, { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', url: `https://wa.me/${SUPPORT_PHONE}`, color: '#25D366' }]
  : SOCIAL_LINKS;
