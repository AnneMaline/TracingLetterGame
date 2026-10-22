import type { LanguageContent } from "../types";
import { letters as englishUppercase } from "./letterSegments/english/capitalLetters";
import { letters as englishLowercase } from "./letterSegments/english/lowercaseLetters";

/**
 * Build-time source for the language packs. vite.config.ts serializes each entry to
 * `lang/<langCode>/letters.json`; the game loads that file at runtime, so app code must
 * never import this module (it would pull language data into the engine bundle).
 * Keys are Curious Reader `cr_lang` codes.
 */
export const languagePacks: Record<string, LanguageContent> = {
  english: { uppercase: englishUppercase, lowercase: englishLowercase },
};
