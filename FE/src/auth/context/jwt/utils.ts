import { paths } from 'src/routes/paths';

import axios from 'src/utils/axios';

import { STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const nameEQ = `${name}=`;
    const cookiesArray = document.cookie.split(';');

    for (let i = 0; i < cookiesArray.length; i += 1) {
      let c = cookiesArray[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
  } catch (error) {
    console.error('Error reading cookie:', error);
  }
  return null;
}

// ----------------------------------------------------------------------

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;

  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

// ----------------------------------------------------------------------

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error removing cookie:', error);
  }
}

// ----------------------------------------------------------------------

export function getStorageToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookieToken = getCookie(STORAGE_KEY);
  if (cookieToken) return cookieToken;

  const localToken = localStorage.getItem(STORAGE_KEY);
  if (localToken) return localToken;

  const sessionToken = sessionStorage.getItem(STORAGE_KEY);
  if (sessionToken) return sessionToken;

  return null;
}

// ----------------------------------------------------------------------

let expiredTimer: NodeJS.Timeout | null = null;

export function tokenExpired(exp: number) {
  if (expiredTimer) {
    clearTimeout(expiredTimer);
  }

  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  if (timeLeft <= 0) {
    setSession(null);
    return;
  }

  expiredTimer = setTimeout(() => {
    try {
      setSession(null);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      setCookie(STORAGE_KEY, accessToken, 7);
      localStorage.setItem(STORAGE_KEY, accessToken);
      sessionStorage.setItem(STORAGE_KEY, accessToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      }
    } else {
      removeCookie(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);

      delete axios.defaults.headers.common.Authorization;

      if (expiredTimer) {
        clearTimeout(expiredTimer);
        expiredTimer = null;
      }
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
