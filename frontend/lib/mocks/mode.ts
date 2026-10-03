const DEMO_OVERRIDE_KEY = "groupup_local_demo";
let demoOverrideForThisTab = false;

export function enableLocalDemoMode(): void {
  demoOverrideForThisTab = true;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_OVERRIDE_KEY, "true");
  } catch {
    // The in-memory override still keeps this tab on the local demo.
  }
}

export function clearLocalDemoMode(): void {
  demoOverrideForThisTab = false;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_OVERRIDE_KEY);
  } catch {
    // Ignore storage restrictions; the in-memory override has already been cleared.
  }
}

function hasStoredDemoOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_OVERRIDE_KEY) === "true";
  } catch {
    return false;
  }
}

export function isMockMode(): boolean {
  if (demoOverrideForThisTab || hasStoredDemoOverride()) return true;
  const setting = process.env.NEXT_PUBLIC_USE_MOCK_API;
  return setting === "true" || (process.env.NODE_ENV === "development" && setting !== "false");
}
