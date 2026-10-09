/** Device-scoped UI preference. This does not alter authorization or any other user's UI. */
export type OS2Preference = "classic" | "os2";
const KEY = "dit-os-ui-preference";
export function readOS2Preference(): OS2Preference {
  try { return window.localStorage.getItem(KEY) === "os2" ? "os2" : "classic"; }
  catch { return "classic"; }
}
export function saveOS2Preference(next: OS2Preference): void {
  try { window.localStorage.setItem(KEY, next); } catch { /* Private browsing may block storage. */ }
}
