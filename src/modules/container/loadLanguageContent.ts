import type { LanguageContent, LetterDefinition } from "../../types";

function isLetterDefinition(value: unknown): value is LetterDefinition {
  const letter = value as Partial<LetterDefinition> | null;
  return (
    typeof letter?.id === "string" &&
    typeof letter.displayLabel === "string" &&
    Array.isArray(letter.segments)
  );
}

export function parseLanguageContent(data: unknown): LanguageContent {
  const content = data as Partial<LanguageContent> | null;
  const { uppercase, lowercase } = content ?? {};
  if (
    !Array.isArray(uppercase) ||
    !Array.isArray(lowercase) ||
    uppercase.length === 0 ||
    lowercase.length === 0 ||
    !uppercase.every(isLetterDefinition) ||
    !lowercase.every(isLetterDefinition)
  ) {
    throw new Error("Language pack letters.json has an invalid shape");
  }
  return { uppercase, lowercase };
}

/**
 * Loads `./lang/<lang>/letters.json` with XHR: `fetch()` rejects file:// URLs in Android
 * WebView, and the container launches the game from file:// (third-party spec §2.3).
 */
export function loadLanguageContent(lang: string): Promise<LanguageContent> {
  const url = `./lang/${encodeURIComponent(lang)}/letters.json`;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.addEventListener("load", () => {
      // file:// success reports status 0 (no HTTP layer).
      if (xhr.status !== 0 && xhr.status !== 200) {
        reject(new Error(`XHR ${xhr.status} for ${url}`));
        return;
      }
      try {
        resolve(parseLanguageContent(JSON.parse(xhr.responseText)));
      } catch (error) {
        reject(error);
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error(`XHR network error for ${url}`)),
    );
    xhr.send();
  });
}
