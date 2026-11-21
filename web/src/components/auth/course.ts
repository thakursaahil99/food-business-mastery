/**
 * Flagship course + real photos shown on the login / register screens.
 * Photos are Red Bean Hospitality's own (redbeanhospitality.com), stored in /public/photos.
 * Plain module (no "use client") so both the server layout and the client brand panel can read it.
 */
export const AUTH_PHOTO = {
  src: "/photos/community-group.webp",
  alt: "Redbean entrepreneurs together at a CGP workshop meet-up",
} as const;

/** The four sectors Redbean runs kitchens in, shown as round photos around the logo. */
export const SECTOR_PHOTOS = [
  { src: "/photos/sector-hospitals.webp", label: "Hospitals", alt: "Hospital staff at lunch in a Redbean-run canteen" },
  { src: "/photos/sector-corporate.webp", label: "Corporate", alt: "Office team eating in a corporate cafeteria" },
  { src: "/photos/sector-industries.webp", label: "Industries", alt: "Factory workers at lunch in an industrial canteen" },
  { src: "/photos/sector-institutions.webp", label: "Institutions", alt: "School students enjoying a meal in their canteen" },
] as const;

export const FLAGSHIP_COURSE = {
  href: "/programs/cgr-mastery",
  eyebrow: "Flagship course",
  title: "CGR Mastery Program",
  meta: ["4 months", "Live classes", "Mentorship"],
  thumb: { src: "/photos/community-group.webp", alt: "CGP workshop batch together at a Redbean meet-up" },
} as const;
