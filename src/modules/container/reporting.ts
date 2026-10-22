import type { LetterDefinition } from "../../types";
import { readLaunchParams } from "./launchParams";

// Must be agreed with the Curious Learning data team and never change between releases.
export const SUB_APP_ID = "tracequest";

type Collection = "user_sessions_data" | "summary_data";
type FieldOp = "add" | "replace";
type EventData = Record<string, string | number | boolean>;

interface Bridge {
  postMessage: (message: string) => void;
}

function getBridge(): Bridge | undefined {
  const bridge = (window as Window & { ReactNativeWebView?: Partial<Bridge> })
    .ReactNativeWebView;
  return typeof bridge?.postMessage === "function"
    ? (bridge as Bridge)
    : undefined;
}

function uuidv4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h.slice(10).join("")}`;
}

/**
 * Posts one `cr_event` envelope to the Curious Reader container (third-party spec §6).
 * Fire-and-forget; silently no-ops outside the container and never throws into gameplay.
 */
export function emitEvent(
  collection: Collection,
  data: EventData,
  options?: Record<string, FieldOp>,
): void {
  try {
    const bridge = getBridge();
    if (!bridge) return;
    bridge.postMessage(
      JSON.stringify({
        type: "cr_event",
        payload: {
          payload_id: uuidv4(),
          cr_user_id: readLaunchParams().userId,
          sub_app_id: SUB_APP_ID,
          payload_version: 1,
          collection,
          timestamp: new Date().toISOString(),
          data,
          ...(options ? { options } : {}),
        },
      }),
    );
  } catch {
    // Reporting must never break gameplay.
  }
}

export function reportLetterCompleted(
  letter: LetterDefinition,
  isHardMode: boolean,
): void {
  emitEvent("user_sessions_data", {
    type: "letter_completed",
    lang: readLaunchParams().lang,
    letter_id: letter.id,
    hard_mode: isHardMode,
  });
  emitEvent(
    "summary_data",
    { letters_completed: 1, last_letter_id: letter.id },
    { letters_completed: "add", last_letter_id: "replace" },
  );
}
