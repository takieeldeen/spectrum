'use client';

import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';
import axios, { endpoints } from 'src/utils/axios';

import { AuthContext } from '../auth-context';
import { setSession, isValidToken, getStorageToken } from './utils';

import type { AuthState } from '../../types';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = getStorageToken();

      if (accessToken && isValidToken(accessToken)) {
        await setSession(accessToken);

        // Fetch live user profile from the backend /me endpoint
        const res = await axios.get(endpoints.auth.me);
        const userData = res.data?.data || res.data;

        const user = {
          ...userData,
          id: userData?._id || userData?.id,
          displayName:
            userData?.name || userData?.displayName || userData?.email?.split('@')[0] || 'User',
          photoURL: userData?.imageUrl || userData?.photoURL || null,
          role: userData?.role ?? 'admin',
          status: userData?.status ?? 'ACTIVE',
          accessToken,
        };

        setState({ user, loading: false });
      } else {
        await setSession(null);
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching user session from /me:', error);
      await setSession(null);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            role: state.user?.role ?? 'admin',
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
