import "server-only";
import { cookies } from "next/headers";
import { isLang, isTextSize, LANG_COOKIE, TEXT_COOKIE, type Lang, type TextSize } from "./dict";

/** The student's chosen language (cookie), English by default. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

/** The student's chosen text size (cookie), normal by default. */
export async function getTextSize(): Promise<TextSize> {
  const v = (await cookies()).get(TEXT_COOKIE)?.value;
  return isTextSize(v) ? v : "md";
}
