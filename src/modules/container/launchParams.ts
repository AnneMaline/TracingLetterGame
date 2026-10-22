export const DEFAULT_LANG = "english";

const LANG_CODE_PATTERN = /^[a-z0-9-]+$/;

export interface LaunchParams {
  lang: string;
  userId: string;
}

/** Reads the query the Curious Reader container appends: `?cr_lang=<code>&cr_user_id=<id>`. */
export function readLaunchParams(
  search: string = window.location.search,
): LaunchParams {
  const params = new URLSearchParams(search);
  const lang = (params.get("cr_lang") ?? "").trim().toLowerCase();
  return {
    lang: LANG_CODE_PATTERN.test(lang) ? lang : DEFAULT_LANG,
    userId: params.get("cr_user_id") ?? "",
  };
}
