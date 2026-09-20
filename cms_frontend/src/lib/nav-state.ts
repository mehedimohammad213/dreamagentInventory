/**
 * Client navigation payload (Next.js has no location.state).
 * Stored in sessionStorage for create/edit flows that pass context between routes.
 */

const NAV_STATE_KEY = "__cm_nav_state__";

export function peekNavigationState<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setNavigationState(state: unknown): void {
  if (typeof window === "undefined") return;
  try {
    if (state === undefined) {
      sessionStorage.removeItem(NAV_STATE_KEY);
    } else {
      sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore quota / private mode
  }
}

export function clearNavigationState(): void {
  setNavigationState(undefined);
}
