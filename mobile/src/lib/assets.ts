import { API_URL } from './config';

/** The API's own address without /api/v1, where cover photos are served from (backend/public/photos). */
const ORIGIN = API_URL.replace(/\/api\/v\d+$/, '');

/** Turns a stored cover path such as /photos/sector-hospitals.webp into a full URL. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${ORIGIN}${path}`;
}
