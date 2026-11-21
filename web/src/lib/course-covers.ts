/**
 * Course cover photos the admin can pick from: Red Bean Hospitality's own photos in /public/photos.
 * A course stores the path (never a full URL). Once the backend exists, uploaded covers go to
 * Storage and come back as a relative path too.
 */
export const COVER_LIBRARY = [
  { src: "/photos/community-group.webp", label: "CGP workshop batch" },
  { src: "/photos/sector-hospitals.webp", label: "Hospital canteen" },
  { src: "/photos/sector-corporate.webp", label: "Corporate cafeteria" },
  { src: "/photos/sector-industries.webp", label: "Industrial canteen" },
  { src: "/photos/sector-institutions.webp", label: "School canteen" },
  { src: "/photos/award-1.webp", label: "Award ceremony" },
  { src: "/photos/award-3.webp", label: "Constitution Club award" },
  { src: "/photos/award-5.webp", label: "Award stage" },
] as const;

/** The flagship program cover. */
export const PROGRAM_COVER = "/photos/community-group.webp";

/** Fallback for courses without a cover. */
export const DEFAULT_COVER = "/photos/sector-corporate.webp";

/** Only site paths are allowed as covers (no remote URLs, no data: URLs). */
export const isSafeCover = (v: unknown): v is string => typeof v === "string" && /^\/photos\/[a-z0-9-]+\.(webp|jpe?g|png)$/i.test(v);
