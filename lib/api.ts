import AsyncStorage from '@react-native-async-storage/async-storage';

let _cookieJar: string = '';

// Persist cookie between app sessions
export async function loadCookies(): Promise<void> {
  _cookieJar = (await AsyncStorage.getItem('session_cookie')) ?? '';
}

async function saveCookies(raw: string): Promise<void> {
  // Extract Set-Cookie headers and store the PHPSESSID
  const match = raw.match(/PHPSESSID=[^;]+/);
  if (match) {
    _cookieJar = match[0];
    await AsyncStorage.setItem('session_cookie', _cookieJar);
  }
}

export async function clearCookies(): Promise<void> {
  _cookieJar = '';
  await AsyncStorage.removeItem('session_cookie');
}

export function getCookieJar(): string {
  return _cookieJar;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

/**
 * Core fetch wrapper — automatically attaches the PHP session cookie
 * and captures Set-Cookie from responses.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (_cookieJar) {
    headers['Cookie'] = _cookieJar;
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Capture new session cookies
  const setCookie = res.headers.get('set-cookie') ?? '';
  if (setCookie) {
    await saveCookies(setCookie);
  }

  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as ApiResponse<T>;
    if (!parsed.success && parsed.error) {
      const e = parsed.error.toLowerCase();
      if (
        e.includes('not authenticated') ||
        e.includes('unauthorized access') ||
        e.includes('branch missing') ||
        e.includes('please log in')
      ) {
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('SESSION_EXPIRED');
      }
    }
    return parsed;
  } catch {
    return { success: false, error: `Server returned non-JSON: ${text.slice(0, 200)}` };
  }
}

/** POST with JSON body */
export async function apiPost<T = unknown>(
  url: string,
  body: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** GET with query params */
export async function apiGet<T = unknown>(
  url: string,
  params: Record<string, string | number> = {}
): Promise<ApiResponse<T>> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();
  return apiFetch<T>(qs ? `${url}?${qs}` : url);
}
