import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let _cookieJar: string = '';
let _isReauthenticating = false;

// Persist cookie between app sessions
export async function loadCookies(): Promise<void> {
  _cookieJar = (await AsyncStorage.getItem('session_cookie')) ?? '';
}

export async function setSessionId(sessionId: string): Promise<void> {
  if (sessionId) {
    _cookieJar = `PHPSESSID=${sessionId}`;
    await AsyncStorage.setItem('session_cookie', _cookieJar);
  }
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
  session_id?: string;
  [key: string]: unknown;
}

/**
 * Attempts silent background re-authentication using stored credentials
 * when the server session expires or becomes invalid.
 */
async function silentReauthenticate(): Promise<boolean> {
  if (_isReauthenticating) return false;
  _isReauthenticating = true;
  try {
    const credsRaw = await AsyncStorage.getItem('biometric_credentials');
    if (!credsRaw) return false;
    const creds = JSON.parse(credsRaw);
    if (!creds?.username || !creds?.password || !creds?.account) return false;

    const { ENDPOINTS } = require('../constants/Config');
    const res = await fetch(ENDPOINTS.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        account: String(creds.account),
        username: creds.username,
        password: creds.password,
      }),
    });

    const data = await res.json();
    if (data?.success && data?.session_id) {
      await setSessionId(data.session_id);
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    _isReauthenticating = false;
  }
}

/**
 * Core fetch wrapper — automatically attaches the PHP session cookie,
 * captures Set-Cookie from responses, and handles silent session renewal.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (_cookieJar) {
    headers['Cookie'] = _cookieJar;
    const sId = _cookieJar.replace('PHPSESSID=', '').trim();
    if (sId) {
      headers['X-Session-ID'] = sId;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network request failed' };
  }

  // Capture new session cookies
  const setCookie = res.headers.get('set-cookie') ?? '';
  if (setCookie) {
    await saveCookies(setCookie);
  }

  let text = '';
  try {
    text = await res.text();
  } catch (err: any) {
    return { success: false, error: 'Failed to read response from server' };
  }

  try {
    const parsed = JSON.parse(text) as ApiResponse<T>;
    if (parsed.session_id && typeof parsed.session_id === 'string') {
      await setSessionId(parsed.session_id);
    }

    if (!parsed.success && parsed.error) {
      const e = parsed.error.toLowerCase();
      const isAuthError =
        e.includes('not authenticated') ||
        e.includes('unauthorized access') ||
        e.includes('branch missing') ||
        e.includes('please log in');

      if (isAuthError && !isRetry && !url.includes('mobile_auth.php')) {
        // Attempt silent re-authentication with saved credentials before kicking user out
        const reauthSuccess = await silentReauthenticate();
        if (reauthSuccess) {
          return apiFetch<T>(url, options, true);
        }
      }

      // Only emit SESSION_EXPIRED if silent reauth failed and not in web preview
      if (isAuthError && Platform.OS !== 'web') {
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
