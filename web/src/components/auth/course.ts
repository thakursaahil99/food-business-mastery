/**
 * Flagship course + real photos shown on the login / register screens.
 * Photos are Red Bean Hospitality's own (redbeanhospitality.com), stored in /public/photos.
 * Plain module (no "use client") so both the server layout and the client brand panel can read it.
 */
export const AUTH_PHOTO = {
  src: "/photos/community-group.webp",
  alt: "Redbean entrepreneurs together at a CGP workshop meet-up",
} as const;

export const FLAGSHIP_COURSE = {
  href: "/programs/cgr-mastery",
  eyebrow: "Flagship course",
  title: "CGR Mastery Program",
  meta: ["4 months", "Live classes", "Mentorship"],
  thumb: { src: "/photos/sector-hospitals.webp", alt: "Hospital staff at lunch in a canteen run by a Redbean contract food business" },
} as const;
