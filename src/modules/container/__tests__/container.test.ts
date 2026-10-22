import { afterEach, describe, expect, it, vi } from "vitest";
import { languagePacks } from "../../../data/languagePacks";
import { readLaunchParams } from "../launchParams";
import { parseLanguageContent } from "../loadLanguageContent";
import { SUB_APP_ID, emitEvent, reportLetterCompleted } from "../reporting";

type BridgeWindow = Window & {
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

describe("readLaunchParams", () => {
  it("reads cr_lang and cr_user_id from the container launch query", () => {
    expect(readLaunchParams("?cr_lang=isixhosa&cr_user_id=abc123")).toEqual({
      lang: "isixhosa",
      userId: "abc123",
    });
  });

  it("defaults to english and an empty user id when params are absent", () => {
    expect(readLaunchParams("")).toEqual({ lang: "english", userId: "" });
  });

  it("rejects language codes that are not safe path segments", () => {
    expect(readLaunchParams("?cr_lang=../secret").lang).toBe("english");
  });
});

describe("parseLanguageContent", () => {
  it("round-trips the serialized english language pack", () => {
    const json = JSON.parse(JSON.stringify(languagePacks.english));
    const content = parseLanguageContent(json);
    expect(content.uppercase).toHaveLength(26);
    expect(content.lowercase).toHaveLength(26);
  });

  it("rejects malformed packs", () => {
    expect(() => parseLanguageContent({ uppercase: [] })).toThrow(
      "invalid shape",
    );
    expect(() => parseLanguageContent(null)).toThrow("invalid shape");
  });
});

describe("cr_event reporting", () => {
  afterEach(() => {
    delete (window as BridgeWindow).ReactNativeWebView;
  });

  it("silently no-ops outside the container", () => {
    expect(() => emitEvent("user_sessions_data", { type: "x" })).not.toThrow();
  });

  it("posts one well-formed envelope per event with a fresh payload_id", () => {
    const postMessage = vi.fn<(message: string) => void>();
    (window as BridgeWindow).ReactNativeWebView = { postMessage };

    reportLetterCompleted(languagePacks.english.uppercase[0], true);

    expect(postMessage).toHaveBeenCalledTimes(2);
    const [session, summary] = postMessage.mock.calls.map(([message]) =>
      JSON.parse(message),
    );

    expect(session.type).toBe("cr_event");
    expect(session.payload).toMatchObject({
      sub_app_id: SUB_APP_ID,
      payload_version: 1,
      collection: "user_sessions_data",
      cr_user_id: "",
      data: {
        type: "letter_completed",
        lang: "english",
        letter_id: "A",
        hard_mode: true,
      },
    });
    expect(session.payload).not.toHaveProperty("options");
    expect(session.payload.payload_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(new Date(session.payload.timestamp).toISOString()).toBe(
      session.payload.timestamp,
    );

    expect(summary.payload).toMatchObject({
      collection: "summary_data",
      data: { letters_completed: 1, last_letter_id: "A" },
      options: { letters_completed: "add", last_letter_id: "replace" },
    });
    expect(summary.payload.payload_id).not.toBe(session.payload.payload_id);
  });

  it("never throws when the bridge throws", () => {
    (window as BridgeWindow).ReactNativeWebView = {
      postMessage: () => {
        throw new Error("bridge down");
      },
    };
    expect(() => emitEvent("summary_data", { a: 1 })).not.toThrow();
  });
});
