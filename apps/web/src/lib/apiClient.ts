import { useAuthStore } from "./authStore";
import { ANTIFORGERY_COOKIE_NAME, ANTIFORGERY_HEADER_NAME } from "./apiServerConfig";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Set default Content-Type to JSON if not uploading FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Anti-CSRF verification token (matching ASP.NET Core Antiforgery)
  const csrfToken = getCookie(ANTIFORGERY_COOKIE_NAME);
  if (csrfToken && !headers.has(ANTIFORGERY_HEADER_NAME)) {
    headers.set(ANTIFORGERY_HEADER_NAME, csrfToken);
  }

  // Requests are routed to Next.js BFF (/api/v1/...) with HttpOnly session cookies.
  // No Authorization: Bearer token is exposed in the browser's request headers.
  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      useAuthStore.getState().logout();
    }
    throw new Error("Session expired or unauthorized.");
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.message) errorMsg = data.message;
      else if (data.detail) errorMsg = data.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
