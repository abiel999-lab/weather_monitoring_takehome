const TOKEN_KEY = "weather_monitor_token";
const AUTH_CHANGE_EVENT = "weather-monitor-auth-change";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function setToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  notifyAuthChange();
}

export function clearToken(): void {
  window.sessionStorage.removeItem(TOKEN_KEY);
  notifyAuthChange();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function getAuthSnapshot(): boolean {
  return isAuthenticated();
}

export function getAuthServerSnapshot(): boolean {
  return false;
}

export function subscribeAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === window.sessionStorage && event.key === TOKEN_KEY) {
      callback();
    }
  };
  const handleLocalChange = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleLocalChange);
  };
}
