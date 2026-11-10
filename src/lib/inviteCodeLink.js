/**
 * Invite friends link codes (?r=code, mig 0415). Pure helpers, no imports, so share builders and
 * Node contract tests can use them. Network calls live in pendingInviteCode.js.
 */

const CODE = /^[a-z0-9]{8,16}$/;
export const INVITE_CODE_PARAM = "r";

export const isInviteCode = (code) => CODE.test(String(code || ""));

/** Adds ?r=code to a Menuply URL. Leaves the URL alone without a valid code. */
export function withInviteCode(url, code) {
  if (!url || !isInviteCode(code)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set(INVITE_CODE_PARAM, code);
    return u.toString();
  } catch {
    return url;
  }
}
