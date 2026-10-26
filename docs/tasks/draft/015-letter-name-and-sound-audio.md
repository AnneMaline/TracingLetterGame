# Task 015 — Letter audio: letter name and letter sound

**Status:** Draft (2026-10-26)
**Milestone:** PRD M3 refinement — letter–sound connection (play-testing feedback, round 2)
**Source feedback:** item 3 of the 2026-10-26 feedback round, "Add audio of sound and name of
letter"
**Interacts with:** task 014. Audio plays when each letter appears, including on auto-advance in
the Start run. This task can be built before 014, but its triggers assume the 014 flow.

## What & why

When a letter appears, the child hears its **name** (for example "bee") and its **sound** (for
example /b/). This connects the shape they trace to the letter's name and sound.

## Spec conflict (needs explicit human confirmation)

This feedback **reverses earlier decisions**:

- The first feedback round, in
  [docs/notes/First feedback - 219-2026.md](../../notes/First%20feedback%20-%20219-2026.md),
  said: "Any sounds that you'd wish to have for the game? — of the letter: **Not good for the
  age-group.**"
- The PRD Spec Change Log entry for 2026-09-03 removed the "audio-cue goal".
- Task 013 put "Sounds or voice prompts" out of scope, citing that feedback.

The default is that the spec wins. Since the human made this its own task, the assumption is that
the 2026-10-26 feedback replaces the 2026-09-21 answer. **Confirm this.** The spec-update pass then
adds a PRD goal and a Resolved Decision that supersedes the earlier position.

## Current behavior (verified in code, 2026-10-26)

**In the code:**

- There is no audio in the game: no files, no playback code, no audio fields in
  [src/types.ts](../../../src/types.ts).
- Language data ships as `lang/<code>/letters.json`. [vite.config.ts](../../../vite.config.ts)
  serializes it from [languagePacks.ts](../../../src/data/languagePacks.ts) and emits only that
  JSON file.
- [scripts/package-cms.mjs](../../../scripts/package-cms.mjs) puts **everything** under
  `dist/lang/<code>/` into `<engine>-lang-<code>.zip`. Files placed in `public/lang/english/audios/`
  are copied there by Vite, so they ship in the language ZIP with no packaging change.
- [loadLanguageContent.ts](../../../src/modules/container/loadLanguageContent.ts) validates
  `id`, `displayLabel` and `segments` only. Extra fields pass through.

**Container rules for audio** ([third-party-game-spec.md](../../reference/third-party-game-spec.md)
§2.3 and §4):

- Per-language audio **must** be under `./lang/{langCode}/audios/`.
- Use MP3 (or WAV for very short clips).
- Paths in the data must be **relative**.
- `new Audio(relativeUrl)` works on `file://`.
- A missing file must not break the game. Use `Promise.allSettled` and a silent fallback.

## Open questions (recommendations in **bold**)

| #   | Question                                     | Options                                                                                                                                                     | Recommendation                                                                                                                                                                                                                                          |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | When does audio play?                        | (a) When a letter opens. (b) A speaker button in the Tracing header to replay it. (c) Again when the letter is completed. (d) On Letter Selection tile tap. | **(a) + (b).** (c) is optional, playing the sound only, to reinforce. Not (d): it would play twice, once on the tap and again when the letter opens.                                                                                                    |
| Q2  | In what order?                               | Name, then sound / sound only / name only                                                                                                                   | **Name, a ~400 ms pause, then the sound** ("bee … /b/").                                                                                                                                                                                                |
| Q3  | Which sound for letters with several sounds? | One sound per letter                                                                                                                                        | **Short vowels (a as in apple, e, i, o, u); hard c and g; x = /ks/; q = /kw/; y = /y/ as in yes.** Confirm the list with the pedagogy adviser.                                                                                                          |
| Q4  | Same audio for upper and lower case?         | Shared / separate                                                                                                                                           | **Shared.** 26 names + 26 sounds = 52 files. Both `a` and `A` point to the same files.                                                                                                                                                                  |
| Q5  | Where do the recordings come from?           | (a) A human voice recording. (b) Text-to-speech generated offline at authoring time. (c) An existing licensed set.                                          | **(a).** It gives a clear licence, a consistent child-friendly voice, and correct isolated phonemes (TTS is often poor at /b/ without a vowel). **Blocking:** the AI cannot record. The human supplies the files, or licensed files with written terms. |
| Q6  | Mute control in the game?                    | Yes / no                                                                                                                                                    | **No.** Device and container volume are enough, and it adds no new choice for children (task 014 removes choices).                                                                                                                                      |

## Scope

### 1. Data (language pack)

Extend `LetterDefinition` with an optional `audio?: { name?: string; sound?: string }`:

- The values are **relative paths**, for example `lang/english/audios/name-a.mp3`.
- The field is optional, so packs without audio still load and play silently.

Author the paths for all 52 English letters. Upper and lower case share files (Q4).

Files go in `public/lang/english/audios/`:

- Names: `name-a.mp3` … `name-z.mp3`.
- Sounds: `sound-a.mp3` … `sound-z.mp3`.

Recording guidance for the human:

- MP3, mono, 22.05 or 44.1 kHz, about 64 kbps.
- Trim leading and trailing silence.
- Make every clip the same loudness.
- Expect about 0.5–1 MB in total.

### 2. Playback module (`src/modules/audio/`)

- `letterAudio.ts` creates **one shared `HTMLAudioElement`** and reuses it. iOS and WebViews unlock
  playback per element after a user gesture. The Start or Train tap, or a tile tap, is that
  gesture, so later auto-advance playback is allowed.
- `playLetterAudio(letter)`:
  - Stops anything still playing.
  - Plays `name`, waits ~400 ms, then plays `sound`.
  - Skips missing fields.
  - Catches every `play()` rejection and media error silently. Audio must never break tracing.
- A cancel function is used when the letter changes or the screen unmounts, so clips never
  overlap.
- Preload the current and the next letter's clips with `Promise.allSettled`.

### 3. Triggers and UI

- Play when a letter opens (Q1 a). In the Start run this includes every auto-advance. Wait a short
  delay (~300 ms) after the letter appears.
- **Speaker button** in the Tracing header (Q1 b):
  - Icon only, at least 48 px, `aria-label="Hear the letter"`,
    `data-testid="letter-audio-button"`.
  - Replays name and sound.
  - Hidden when the letter has no `audio`.
- Optional, if Q1 (c) is accepted: play the sound only on `letter-complete`, before the
  celebration.

## What "done" looks like

This traces to [PRD](../../specs/PRD.md) v0.9.0, [DEVSPEC](../../specs/DEVSPEC.md) v0.12.0,
[UISPEC](../../specs/UISPEC.md) v0.10.0 and [TESTSPEC](../../specs/TESTSPEC.md) v0.11.0, plus
[standalone-game-spec.md](../../standalone-game-spec.md) §4:

- **DEVSPEC §2 Data Schema:** `LetterDefinition.audio` is documented as optional with relative
  paths. **DEVSPEC §3** gets a new "Letter Audio" module. **DEVSPEC §5 Error Handling** gets a new
  row: a missing or undecodable clip plays nothing and the game continues.
- New TESTSPEC cases are proposed for the spec-update pass. The final IDs are assigned in merge
  order.
  - **T-049 (unit):**
    - `playLetterAudio` plays name, then sound, in order.
    - A second call cancels the first.
    - A rejected `play()` or a missing field does not throw.
    - jsdom does not implement media playback, so stub `HTMLMediaElement.prototype.play` and
      `pause`.
  - **T-050 (unit, fixture invariant):**
    - Every English letter has `audio.name` and `audio.sound`.
    - Every path is relative and starts with `lang/english/audios/`.
    - Every referenced file exists under `public/` (checked with `fs`).
  - **T-051 (integration):**
    - Opening a letter triggers playback once.
    - The speaker button replays it.
    - Moving to the next letter stops the previous clip.
  - **T-052 (integration):**
    - A letter without `audio` renders no speaker button.
    - Tracing is unaffected.
- A UISPEC update is proposed: add the speaker button to the Tracing screen components and test
  IDs, plus a Gherkin feature "Letter name and sound".
- `npm run check` passes.
- The packaged build is checked in a headless browser from `file://` with the network off (T-016).
  The checks are:
  - No failed requests.
  - Clips play after the first tap.
  - `release/<engine>-lang-english.zip` contains `lang/english/audios/*.mp3`.

## Out of scope

- Celebration or reward sounds.
- Sound effects for tracing, reset or deviation.
- Voice instructions ("trace from the green dot").
- Audio for languages other than English. The schema supports them; recordings are a content task.
- A mute or volume control (Q6).

## Implementation steps

1. The human confirms the spec conflict and answers Q1–Q6, then supplies the 52 MP3s (Q5).
2. Add `audio?: { name?: string; sound?: string }` to `LetterDefinition` in
   [types.ts](../../../src/types.ts).
3. Author the `audio` paths in every file under `src/data/letterSegments/english/` (52 files).
   Alternatively, set them in one place in
   [languagePacks.ts](../../../src/data/languagePacks.ts) by mapping each id to lowercase. Pick the
   one that keeps fixtures readable, and keep it data-driven.
4. Add the files to `public/lang/english/audios/`. Confirm that `npm run build` copies them to
   `dist/lang/english/audios/`.
5. Implement `src/modules/audio/letterAudio.ts` and wire the triggers in
   [LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx) (or `TracingScreen`). Add the
   speaker button to [TracingHeader.tsx](../../../src/modules/tracing/TracingHeader.tsx).
6. Write tests T-049 to T-052.
7. Run `npm run check`, then `npm run package:cms`.
8. Check the lang ZIP contents. The human re-uploads **both** the core and the `english` language
   ZIP.

## Real-device checklist (human)

1. Fresh install of the core and lang ZIPs. After pressing Start, `a` says its name and then its
   sound.
2. Every auto-advanced letter speaks without another tap, in both Android WebView and iOS if used.
3. The speaker button replays the clip. Pressing it repeatedly never stacks or overlaps clips.
4. Clips are clear, equally loud, and the sounds are correct for all 26 letters (Q3).
5. Audio never delays or blocks tracing on the legacy device.
6. Airplane mode: everything still plays.
